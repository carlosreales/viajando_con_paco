import { Pool } from 'pg';
import { createApp } from './app';
import { PostgresPetRepository } from './pets/postgres.repository';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  const app = await createApp(new PostgresPetRepository(pool));
  await app.listen(Number(process.env.PORT ?? 3000), '127.0.0.1');
}
main().catch(() => { console.error('STARTUP_FAILED: verify configuration.'); process.exitCode = 1; });

