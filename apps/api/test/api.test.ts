import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp, IdentityResolver } from '../src/app';
import { demoIdentity } from '../src/demo-identity';
import { MemoryPetRepository } from '../src/pets/repository';

test('HTTP contract: create/read, isolation, errors, quota and concurrent writes', async () => {
  const alice = randomUUID(), bob = randomUUID(), disabled = randomUUID();
  const repo = new MemoryPetRepository(new Map([
    [alice, { id: alice, enabled: true, activeLimit: 2 }],
    [bob, { id: bob, enabled: true, activeLimit: 2 }],
    [disabled, { id: disabled, enabled: false, activeLimit: 2 }]
  ]));
  // Test-only resolver, never imported by an application entrypoint.
  const identity: IdentityResolver = { resolve: async req => {
    const id = ({ 'Bearer alice': alice, 'Bearer bob': bob, 'Bearer disabled': disabled } as Record<string, string>)[req.headers.authorization ?? ''];
    return id ? { id, timeZone: 'Europe/Madrid' } : undefined;
  } };
  const app = await createApp(repo, identity, () => new Date('2026-09-13T12:00:00Z'));
  await app.listen(0, '127.0.0.1');
  const url = await app.getUrl();
  const request = async (path: string, token = 'alice', method = 'GET', body?: unknown) => {
    const response = await fetch(url + path, {
      method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
  };
  const input = { name: 'Paco', species: 'DOG', birthDate: '2024-02-29' };
  try {
    assert.equal((await request('/v1/pets', 'nobody')).status, 401);
    assert.equal((await request('/v1/pets', 'disabled')).status, 403);
    const initial = await request('/v1/pets');
    assert.deepEqual(initial.body, { items: [] });
    assert.equal(initial.cache, 'no-store');
    const invalid = await request('/v1/pets', 'alice', 'POST', { ...input, ownerId: bob });
    assert.equal(invalid.status, 400);
    assert.deepEqual((await request('/v1/pets')).body.items, []);
    const created = await request('/v1/pets', 'alice', 'POST', input);
    assert.equal(created.status, 201);
    assert.equal(created.body.visibility, 'PRIVATE');
    assert.equal(created.body.name, 'Paco');
    assert.equal(created.body.ownerId, undefined);
    assert.match(created.body.id, /^[0-9a-f-]{36}$/);
    assert.equal((await request('/v1/pets/' + created.body.id)).status, 200);
    const cross = await request('/v1/pets/' + created.body.id, 'bob');
    const absent = await request('/v1/pets/' + randomUUID(), 'bob');
    assert.deepEqual(cross.body, absent.body);
    assert.equal(cross.status, 404);
    assert.equal((await request('/v1/pets/not-uuid')).status, 404);
    assert.deepEqual((await request('/v1/pets', 'bob')).body, { items: [] });
    const results = await Promise.all(Array.from({ length: 8 }, () => request('/v1/pets', 'alice', 'POST', input)));
    assert.equal(results.filter(r => r.status === 201).length, 1);
    assert.equal(results.filter(r => r.status === 409 && r.body.error.code === 'PET_LIMIT').length, 7);
    assert.equal((await request('/v1/pets')).body.items.length, 2);
    assert.equal((await request('/v1/pets', 'bob', 'POST', input)).status, 201);
    const oversized = await request('/v1/pets', 'bob', 'POST', { ...input, name: 'x'.repeat(20000) });
    assert.equal(oversized.status, 413);
    assert.equal((await request('/v1/pets', 'bob')).body.items.length, 1);
    const malformed = await fetch(url + '/v1/pets', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer alice' }, body: '{invalid'
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: { code: 'INVALID_INPUT' } });
  } finally { await app.close(); }
});
test('CA-07 default application refuses all user access', async () => {
  const app = await createApp(new MemoryPetRepository(new Map()));
  await app.listen(0, '127.0.0.1');
  try {
    const response = await fetch(await app.getUrl() + '/v1/pets', { headers: { Authorization: 'Bearer demo', 'x-user-id': randomUUID() } });
    assert.equal(response.status, 401);
  } finally { await app.close(); }
});
test('CA-07 demo fails closed outside explicit development', () => {
  const principal = { id: randomUUID(), timeZone: 'UTC' };
  for (const env of [undefined, 'production', 'test', 'staging']) {
    assert.throws(() => demoIdentity('x'.repeat(64), principal, env));
  }
  assert.throws(() => demoIdentity('short', principal, 'development'));
});

