import { randomBytes, randomUUID } from 'node:crypto';
import { createApp } from './app';
import { demoIdentity } from './demo-identity';
import { MemoryPetRepository } from './pets/repository';

async function demo() {
  if (process.env.NODE_ENV !== 'development') throw new Error('DEMO_REQUIRES_DEVELOPMENT');
  const ownerId = randomUUID();
  const token = randomBytes(32).toString('hex');
  const repo = new MemoryPetRepository(new Map([[ownerId, { id: ownerId, enabled: true, activeLimit: 2 }]]));
  const app = await createApp(repo, demoIdentity(token, { id: ownerId, timeZone: 'Europe/Madrid' }, process.env.NODE_ENV));
  await app.listen(3000, '127.0.0.1');
  // Explicit local-only handoff, never an application log of a production credential.
  console.log('DEMO: synthetic data in memory. Local URL http://127.0.0.1:3000');
  console.log('Ephemeral local development token: ' + token);
}
demo().catch(() => { console.error('DEMO_START_FAILED: use NODE_ENV=development and an available port.'); process.exitCode = 1; });

