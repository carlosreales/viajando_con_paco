-- Covers the composite pet/owner foreign key for projects upgraded from 003.
CREATE INDEX IF NOT EXISTS paco_vaccinations_pet_owner
  ON public.paco_vaccinations (pet_id, owner_id);
