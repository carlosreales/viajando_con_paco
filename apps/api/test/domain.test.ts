import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageAt, civilDate, DomainError, lifeStage, todayInZone, validatePet } from '../src/pets/domain';

const valid = { name: ' Paco ', species: 'DOG', birthDate: '2024-02-29' };
test('CA-01 minimal input normalizes name and exact date defaults false', () => {
  assert.deepEqual(validatePet(valid, '2026-09-13'), { ...valid, name: 'Paco', birthDateIsEstimated: false });
});
for (const [label, patch] of Object.entries({
  future: { birthDate: '2026-09-14' }, old: { birthDate: '1986-09-12' },
  impossible: { birthDate: '2025-02-29' }, missingName: { name: '' },
  nameType: { name: 123 }, species: { species: 'WOLF' }, nameLength: { name: 'a'.repeat(81) },
  estimatedType: { birthDateIsEstimated: 'false' },
  arrivalBefore: { arrivalDate: '2023-01-01' }, arrivalFuture: { arrivalDate: '2026-09-14' },
  lowWeight: { weightKg: 0.09 }, highWeight: { weightKg: 120.1 }, nan: { weightKg: NaN },
  assignOwner: { ownerId: 'attacker' }, assignPlan: { plan: 'PREMIUM' },
  assignState: { status: 'ARCHIVED' }, assignVisibility: { visibility: 'PUBLIC' }
})) {
  test('CA-02 rejects ' + label, () => {
    assert.throws(() => validatePet({ ...valid, ...patch }, '2026-09-13'),
      (e: unknown) => e instanceof DomainError && e.code === 'INVALID_INPUT');
  });
}
test('CA-02 inclusive boundaries for 40 years, arrival and weights', () => {
  assert.equal(validatePet({ ...valid, birthDate: '1986-09-13', arrivalDate: '1986-09-13', weightKg: 0.1 }, '2026-09-13').weightKg, 0.1);
  assert.equal(validatePet({ ...valid, weightKg: 120 }, '2026-09-13').weightKg, 120);
});
test('CA-05 age handles days, weeks, months, years and month-end anniversaries', () => {
  assert.equal(ageAt('2026-09-01', '2026-09-13').value, 12);
  assert.equal(ageAt('2026-08-01', '2026-09-13').unit, 'weeks');
  assert.equal(ageAt('2026-01-31', '2026-02-28').months, 1);
  assert.equal(ageAt('2024-02-29', '2025-02-28').months, 12);
  assert.deepEqual(ageAt('2024-01-13', '2026-09-13'), { unit: 'years', value: 2, remainderMonths: 8, months: 32 });
});
test('CA-05 stages use exact inclusive boundaries for every size', () => {
  const rows = [
    ['CAT', 'MEDIUM', [6, 12, 84, 132]], ['DOG', 'SMALL', [6, 12, 96, 132]],
    ['DOG', 'MEDIUM', [8, 15, 84, 120]], ['DOG', 'LARGE', [12, 20, 72, 96]],
    ['DOG', 'GIANT', [15, 24, 60, 84]]
  ] as const;
  const stages = ['PUPPY','JUNIOR','ADULT','MATURE','SENIOR'];
  for (const [species, size, limits] of rows) {
    limits.forEach((limit, index) => {
      assert.equal(lifeStage(species, limit - 1, size), stages[index]);
      assert.equal(lifeStage(species, limit, size), stages[index + 1]);
    });
  }
  assert.equal(lifeStage('OTHER', 10), 'UNSPECIFIED');
  assert.equal(lifeStage('DOG', 14), 'JUNIOR');
});
test('CA-05 today follows owner zone including daylight saving', () => {
  const now = new Date('2026-09-13T23:30:00Z');
  assert.equal(todayInZone(now, 'Europe/Madrid'), '2026-09-14');
  assert.equal(todayInZone(now, 'America/Mexico_City'), '2026-09-13');
});
test('date parser rejects rollover, format and non-string values', () => {
  for (const input of ['2026-04-31', '2026-13-01', '26-01-01', null, 123]) {
    assert.throws(() => civilDate(input));
  }
});

