import { randomUUID } from 'node:crypto';

export class DomainError extends Error {
  constructor(public readonly code: string, public readonly status: number) { super(code); }
}
export type Species = 'DOG' | 'CAT' | 'OTHER';
export type Size = 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';
export interface Principal { id: string; timeZone: string }
export interface PetInput {
  name: string; species: Species; birthDate: string; birthDateIsEstimated: boolean;
  arrivalDate?: string; weightKg?: number;
}
export interface Pet extends PetInput {
  id: string; ownerId: string; status: 'ACTIVE' | 'ARCHIVED' | 'DECEASED';
  visibility: 'PRIVATE'; createdAt: string;
}
const fail = (): never => { throw new DomainError('INVALID_INPUT', 400); };
export function civilDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail();
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return fail();
  return value;
}
export function todayInZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return part('year') + '-' + part('month') + '-' + part('day');
}
export function validatePet(raw: unknown, today: string): PetInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail();
  const data = raw as Record<string, unknown>;
  const allowed = ['name', 'species', 'birthDate', 'birthDateIsEstimated', 'arrivalDate', 'weightKg'];
  if (Object.keys(data).some(k => !allowed.includes(k))) return fail();
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 80) return fail();
  if (!['DOG', 'CAT', 'OTHER'].includes(data.species as string)) return fail();
  const birthDate = civilDate(data.birthDate);
  const oldest = String(Number(today.slice(0, 4)) - 40).padStart(4, '0') + today.slice(4);
  if (birthDate > today || birthDate < oldest) return fail();
  if (data.birthDateIsEstimated !== undefined && typeof data.birthDateIsEstimated !== 'boolean') return fail();
  const result: PetInput = {
    name: data.name.trim(), species: data.species as Species, birthDate,
    birthDateIsEstimated: data.birthDateIsEstimated === true
  };
  if (data.arrivalDate !== undefined) {
    const arrival = civilDate(data.arrivalDate);
    if (arrival < birthDate || arrival > today) return fail();
    result.arrivalDate = arrival;
  }
  if (data.weightKg !== undefined) {
    if (typeof data.weightKg !== 'number' || !Number.isFinite(data.weightKg) ||
        data.weightKg < 0.1 || data.weightKg > 120) return fail();
    result.weightKg = data.weightKg;
  }
  return result;
}
export function ageAt(birth: string, today: string) {
  civilDate(birth); civilDate(today);
  if (birth > today) return fail();
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const anniversaryDay = Math.min(bd, new Date(Date.UTC(ty, tm, 0)).getUTCDate());
  const months = (ty - by) * 12 + tm - bm - (td < anniversaryDay ? 1 : 0);
  const days = Math.floor((Date.parse(today) - Date.parse(birth)) / 86400000);
  if (months < 1) return { unit: 'days', value: days, months };
  if (months < 3) return { unit: 'weeks', value: Math.floor(days / 7), months };
  if (months < 24) return { unit: 'months', value: months, months };
  return { unit: 'years', value: Math.floor(months / 12), remainderMonths: months % 12, months };
}
export function lifeStage(species: Species, months: number, size: Size = 'MEDIUM') {
  if (species === 'OTHER') return 'UNSPECIFIED';
  const thresholds = species === 'CAT' ? [6, 12, 84, 132] :
    ({ SMALL: [6, 12, 96, 132], MEDIUM: [8, 15, 84, 120],
      LARGE: [12, 20, 72, 96], GIANT: [15, 24, 60, 84] })[size];
  const index = thresholds.findIndex(limit => months < limit);
  return ['PUPPY', 'JUNIOR', 'ADULT', 'MATURE', 'SENIOR'][index < 0 ? 4 : index];
}
export function newPet(ownerId: string, input: PetInput, now: Date): Pet {
  return { ...input, id: randomUUID(), ownerId, status: 'ACTIVE', visibility: 'PRIVATE', createdAt: now.toISOString() };
}
export function profile(pet: Pet, today: string) {
  const age = ageAt(pet.birthDate, today);
  // Breed catalogue is not implemented: RN-012 uses medium for unknown dogs.
  const { ownerId: _ownerId, ...publicToOwner } = pet;
  void _ownerId;
  return { ...publicToOwner, age, lifeStage: lifeStage(pet.species, age.months) };
}

