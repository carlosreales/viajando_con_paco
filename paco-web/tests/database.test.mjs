import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const pet='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',memory='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
test('PostgreSQL: RLS, ownership, quotas, dates and protected columns',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon;`);
  await db.exec(await readFile(new URL('../supabase/001_schema.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/003_vaccinations.sql',import.meta.url),'utf8'));
  await db.exec(`INSERT INTO auth.users VALUES('${a}'),('${b}');`);
  async function as(id,sql){await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${id}',false);`);try{return await db.query(sql);}finally{await db.exec('RESET ROLE');}}
  await as(a,`INSERT INTO paco_pets(id,name,species,birth_date) VALUES('${pet}','Paco','DOG','2023-01-01')`);
  assert.equal((await as(a,'SELECT * FROM paco_pets')).rows.length,1);
  assert.equal((await as(b,'SELECT * FROM paco_pets')).rows.length,0);
  assert.equal((await as(b,`UPDATE paco_pets SET name='Changed' WHERE id='${pet}' RETURNING id`)).rows.length,0);
  assert.equal((await as(a,'SELECT name FROM paco_pets')).rows[0].name,'Paco');
  await assert.rejects(as(a,`INSERT INTO paco_pets(owner_id,name,species,birth_date) VALUES('${b}','Bad','DOG','2023-01-01')`),/permission denied/);
  await assert.rejects(as(a,`UPDATE paco_pets SET photo_path='hack' WHERE id='${pet}'`),/permission denied/);
  await assert.rejects(as(a,`UPDATE paco_profiles SET max_pets=10 WHERE user_id='${a}'`),/permission denied/);
  await assert.rejects(as(a,`INSERT INTO paco_pets(name,species,birth_date) VALUES('Future','CAT',CURRENT_DATE+1)`),/PACO_INVALID_DATE/);
  await assert.rejects(as(a,`INSERT INTO paco_pets(name,species,birth_date) VALUES('Old','CAT',CURRENT_DATE-interval '41 years')`),/PACO_INVALID_DATE/);
  await assert.rejects(as(a,`INSERT INTO paco_pets(name,species,birth_date,weight) VALUES('Heavy','DOG','2023-01-01',121)`),/check constraint/);
  await as(a,`INSERT INTO paco_pets(name,species,birth_date) VALUES('Luna','CAT','2023-01-01')`);
  await assert.rejects(as(a,`INSERT INTO paco_pets(name,species,birth_date) VALUES('Third','CAT','2023-01-01')`),/PACO_PET_LIMIT/);
  await assert.rejects(as(b,`INSERT INTO paco_memories(pet_id,title,event_date) VALUES('${pet}','Intruder','2024-01-01')`),/PACO_NOT_FOUND/);
  await assert.rejects(as(a,`INSERT INTO paco_memories(pet_id,title,event_date) VALUES('${pet}','Too early','2022-01-01')`),/PACO_INVALID_DATE/);
  await as(a,`INSERT INTO paco_memories(id,pet_id,title,event_date) VALUES('${memory}','${pet}','First walk','2024-01-01')`);
  const vaccine='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  await as(a,`INSERT INTO paco_vaccinations(id,pet_id,vaccine_name,administered_on,next_due_on,notes) VALUES('${vaccine}','${pet}','Rabia','2024-02-01','2025-02-01','Anual')`);
  assert.equal((await as(a,'SELECT * FROM paco_vaccinations')).rows.length,1);
  assert.equal((await as(b,'SELECT * FROM paco_vaccinations')).rows.length,0);
  await assert.rejects(as(b,`INSERT INTO paco_vaccinations(pet_id,vaccine_name,administered_on) VALUES('${pet}','Ajena','2024-02-01')`),/PACO_NOT_FOUND/);
  assert.equal((await as(b,`UPDATE paco_vaccinations SET vaccine_name='Ajena' WHERE id='${vaccine}' RETURNING id`)).rows.length,0);
  assert.equal((await as(a,`SELECT vaccine_name FROM paco_vaccinations WHERE id='${vaccine}'`)).rows[0].vaccine_name,'Rabia');
  await assert.rejects(as(a,`INSERT INTO paco_vaccinations(pet_id,vaccine_name,administered_on) VALUES('${pet}','Antes','2022-01-01')`),/PACO_INVALID_VACCINATION_DATE/);
  await assert.rejects(as(a,`INSERT INTO paco_vaccinations(pet_id,vaccine_name,administered_on) VALUES('${pet}','Futura',CURRENT_DATE+1)`),/PACO_INVALID_VACCINATION_DATE/);
  await assert.rejects(as(a,`INSERT INTO paco_vaccinations(pet_id,vaccine_name,administered_on,next_due_on) VALUES('${pet}','Orden','2024-02-01','2024-01-01')`),/check constraint|PACO_INVALID_VACCINATION_DUE_DATE/);
  await as(a,`UPDATE paco_vaccinations SET next_due_on='2025-03-01' WHERE id='${vaccine}'`);
  assert.equal((await as(a,`SELECT next_due_on::text AS next_due_on FROM paco_vaccinations WHERE id='${vaccine}'`)).rows[0].next_due_on,'2025-03-01');
  await as(a,`DELETE FROM paco_vaccinations WHERE id='${vaccine}'`);
  assert.equal((await as(a,'SELECT * FROM paco_vaccinations')).rows.length,0);
  assert.equal((await as(b,'SELECT * FROM paco_memories')).rows.length,0);
  await assert.rejects(as(a,`UPDATE paco_pets SET birth_date='2025-01-01' WHERE id='${pet}'`),/PACO_BIRTH_AFTER_MEMORY/);
  await db.exec(`UPDATE paco_profiles SET max_memories=1 WHERE user_id='${a}'`);
  await assert.rejects(as(a,`INSERT INTO paco_memories(pet_id,title,event_date) VALUES('${pet}','Excess','2024-01-01')`),/PACO_MEMORY_LIMIT/);
  await db.exec('SET ROLE anon');
  await assert.rejects(db.query('SELECT * FROM paco_pets'),/permission denied/);
  await db.exec('RESET ROLE');
 }finally{await db.close();}
});
test('Storage policy: private bucket and user-scoped reads; no direct uploads',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;GRANT USAGE ON SCHEMA auth TO authenticated;CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE TABLE storage.objects(bucket_id text,name text);ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;GRANT USAGE ON SCHEMA storage TO authenticated;GRANT SELECT,INSERT ON storage.objects TO authenticated;`);
  await db.exec(await readFile(new URL('../supabase/002_storage.sql',import.meta.url),'utf8'));
  assert.equal((await db.query("SELECT public FROM storage.buckets WHERE id='paco-photos'")).rows[0].public,false);
  await db.exec(`INSERT INTO storage.objects VALUES('paco-photos','${a}/pet/a.jpg'),('paco-photos','${b}/pet/b.jpg'); SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${a}',false);`);
  const rows=(await db.query('SELECT name FROM storage.objects')).rows;
  assert.deepEqual(rows,[{name:a+'/pet/a.jpg'}]);
  await assert.rejects(db.query(`INSERT INTO storage.objects VALUES('paco-photos','${a}/raw.jpg')`),/row-level security/);
 }finally{await db.close();}
});

