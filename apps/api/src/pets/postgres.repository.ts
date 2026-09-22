import { Pool, PoolClient } from 'pg';
import { DomainError, newPet, Pet, PetInput } from './domain';
import { PetRepository } from './repository';

export class PostgresPetRepository implements PetRepository {
  constructor(private readonly pool: Pool) {}
  private async checkOwner(client: PoolClient, ownerId: string) {
    const result = await client.query<{ active_pet_limit: number; status: string }>(
      'SELECT p.active_pet_limit, o.status FROM owners o JOIN plans p ON p.id=o.plan_id WHERE o.id=$1 FOR UPDATE OF o',
      [ownerId]);
    if (!result.rows[0] || result.rows[0].status !== 'ACTIVE') throw new DomainError('ACCOUNT_UNAVAILABLE', 403);
    return result.rows[0].active_pet_limit;
  }
  private async withOwner<T>(ownerId: string, work: (client: PoolClient, limit: number) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const limit = await this.checkOwner(client, ownerId);
      const result = await work(client, limit);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
  async create(ownerId: string, input: PetInput, now: Date): Promise<Pet> {
    return this.withOwner(ownerId, async (client, limit) => {
      const count = await client.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM pets WHERE owner_id=$1 AND status='ACTIVE'", [ownerId]);
      if (count.rows[0].count >= limit) throw new DomainError('PET_LIMIT', 409);
      const pet = newPet(ownerId, input, now);
      await client.query(
        'INSERT INTO pets (id,owner_id,name,species,birth_date,birth_date_is_estimated,arrival_date,weight_kg,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [pet.id, ownerId, pet.name, pet.species, pet.birthDate, pet.birthDateIsEstimated,
          pet.arrivalDate ?? null, pet.weightKg ?? null, pet.createdAt]);
      return pet;
    });
  }
  private readonly select = `SELECT id, owner_id AS "ownerId", name, species,
    to_char(birth_date,'YYYY-MM-DD') AS "birthDate",
    birth_date_is_estimated AS "birthDateIsEstimated",
    to_char(arrival_date,'YYYY-MM-DD') AS "arrivalDate",
    weight_kg::float8 AS "weightKg", status, visibility,
    to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt" FROM pets`;
  async list(ownerId: string): Promise<Pet[]> {
    return this.withOwner(ownerId, async client => {
      const result = await client.query<Pet>(this.select + ' WHERE owner_id=$1 ORDER BY created_at,id', [ownerId]);
      return result.rows;
    });
  }
  async find(ownerId: string, id: string): Promise<Pet | undefined> {
    return this.withOwner(ownerId, async client => {
      const result = await client.query<Pet>(this.select + ' WHERE owner_id=$1 AND id=$2', [ownerId, id]);
      return result.rows[0];
    });
  }
}

