-- Initial schema. Apply to an empty development database in a transaction.
-- No production accounts or commercial plans are seeded.
BEGIN;
CREATE TABLE plans (
  id text PRIMARY KEY,
  active_pet_limit integer NOT NULL CHECK (active_pet_limit BETWEEN 1 AND 100)
);
CREATE TABLE owners (
  id uuid PRIMARY KEY,
  plan_id text NOT NULL REFERENCES plans(id),
  time_zone text NOT NULL,
  status text NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED','DELETION_PENDING'))
);
CREATE TABLE pets (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES owners(id),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  species text NOT NULL CHECK (species IN ('DOG','CAT','OTHER')),
  birth_date date NOT NULL,
  birth_date_is_estimated boolean NOT NULL DEFAULT false,
  arrival_date date CHECK (arrival_date >= birth_date),
  weight_kg numeric CHECK (weight_kg >= 0.1 AND weight_kg <= 120),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED','DECEASED')),
  visibility text NOT NULL DEFAULT 'PRIVATE' CHECK (visibility = 'PRIVATE'),
  created_at timestamptz NOT NULL
);
CREATE INDEX pets_owner_created ON pets(owner_id, created_at, id);
CREATE INDEX pets_owner_active ON pets(owner_id) WHERE status = 'ACTIVE';
COMMIT;

