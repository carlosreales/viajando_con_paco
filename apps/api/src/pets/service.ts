import { DomainError, Principal, profile, todayInZone, validatePet } from './domain';
import { PetRepository } from './repository';

export class PetsService {
  constructor(private readonly repo: PetRepository, private readonly clock: () => Date = () => new Date()) {}
  async create(principal: Principal, body: unknown) {
    const now = this.clock();
    const today = todayInZone(now, principal.timeZone);
    const input = validatePet(body, today);
    return profile(await this.repo.create(principal.id, input, now), today);
  }
  async list(principal: Principal) {
    const today = todayInZone(this.clock(), principal.timeZone);
    return (await this.repo.list(principal.id)).map(p => profile(p, today));
  }
  async find(principal: Principal, id: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new DomainError('NOT_FOUND', 404);
    const pet = await this.repo.find(principal.id, id);
    if (!pet) throw new DomainError('NOT_FOUND', 404);
    return profile(pet, todayInZone(this.clock(), principal.timeZone));
  }
}

