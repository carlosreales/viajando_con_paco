import { DomainError, newPet, Pet, PetInput } from './domain';

export interface PetRepository {
  create(ownerId: string, input: PetInput, now: Date): Promise<Pet>;
  list(ownerId: string): Promise<Pet[]>;
  find(ownerId: string, id: string): Promise<Pet | undefined>;
}
export interface DemoAccount { id: string; activeLimit: number; enabled: boolean }

// Test/demo only. A synchronous critical section ensures count + insert cannot interleave.
export class MemoryPetRepository implements PetRepository {
  private readonly pets = new Map<string, Pet>();
  constructor(private readonly accounts: ReadonlyMap<string, DemoAccount>) {}
  private account(ownerId: string) {
    const account = this.accounts.get(ownerId);
    if (!account || !account.enabled) throw new DomainError('ACCOUNT_UNAVAILABLE', 403);
    return account;
  }
  async create(ownerId: string, input: PetInput, now: Date): Promise<Pet> {
    const account = this.account(ownerId);
    const count = [...this.pets.values()].filter(p => p.ownerId === ownerId && p.status === 'ACTIVE').length;
    if (count >= account.activeLimit) throw new DomainError('PET_LIMIT', 409);
    const pet = newPet(ownerId, input, now);
    this.pets.set(pet.id, pet);
    return structuredClone(pet);
  }
  async list(ownerId: string): Promise<Pet[]> {
    this.account(ownerId);
    return [...this.pets.values()].filter(p => p.ownerId === ownerId).map(p => structuredClone(p));
  }
  async find(ownerId: string, id: string): Promise<Pet | undefined> {
    this.account(ownerId);
    const pet = this.pets.get(id);
    return pet?.ownerId === ownerId ? structuredClone(pet) : undefined;
  }
}

