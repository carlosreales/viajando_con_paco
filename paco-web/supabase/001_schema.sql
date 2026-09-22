BEGIN;
CREATE TABLE public.paco_profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 max_pets integer NOT NULL DEFAULT 2 CHECK(max_pets BETWEEN 1 AND 10),
 max_memories integer NOT NULL DEFAULT 500 CHECK(max_memories BETWEEN 1 AND 2000)
);
CREATE FUNCTION public.paco_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN INSERT INTO public.paco_profiles(user_id) VALUES(NEW.id) ON CONFLICT DO NOTHING; RETURN NEW; END $$;
CREATE TRIGGER paco_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.paco_new_user();
INSERT INTO public.paco_profiles(user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;

CREATE TABLE public.paco_pets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(char_length(trim(name)) BETWEEN 1 AND 80),
 species text NOT NULL CHECK(species IN ('DOG','CAT','OTHER')),
 birth_date date NOT NULL,
 estimated boolean NOT NULL DEFAULT false,
 breed text NOT NULL DEFAULT '' CHECK(char_length(breed)<=80),
 gender text NOT NULL DEFAULT 'UNKNOWN' CHECK(gender IN ('MALE','FEMALE','UNKNOWN')),
 weight numeric CHECK(weight BETWEEN 0.1 AND 120),
 photo_path text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,owner_id),
 CHECK(photo_path IS NULL OR photo_path LIKE owner_id::text||'/'||id::text||'/%')
);
CREATE TABLE public.paco_memories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 pet_id uuid NOT NULL,
 title text NOT NULL CHECK(char_length(trim(title)) BETWEEN 1 AND 100),
 event_date date NOT NULL,
 note text NOT NULL DEFAULT '' CHECK(char_length(note)<=1000),
 photo_path text,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(pet_id,owner_id) REFERENCES public.paco_pets(id,owner_id) ON DELETE CASCADE,
 CHECK(photo_path IS NULL OR photo_path LIKE owner_id::text||'/'||pet_id::text||'/%')
);
CREATE INDEX paco_pets_owner ON public.paco_pets(owner_id,created_at);
CREATE INDEX paco_memories_pet_date ON public.paco_memories(pet_id,event_date DESC,id);
CREATE INDEX paco_memories_owner_id ON public.paco_memories(owner_id);
CREATE INDEX paco_memories_pet_owner ON public.paco_memories(pet_id,owner_id);

CREATE FUNCTION public.paco_pet_rules() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE allowed integer; count_pets integer; today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF NEW.birth_date>today OR NEW.birth_date<(today-interval '40 years')::date THEN RAISE EXCEPTION 'PACO_INVALID_DATE' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.id<>OLD.id OR NEW.owner_id<>OLD.owner_id OR NEW.created_at<>OLD.created_at) THEN RAISE EXCEPTION 'PACO_IMMUTABLE' USING ERRCODE='23514'; END IF;
 SELECT max_pets INTO allowed FROM public.paco_profiles WHERE user_id=NEW.owner_id FOR UPDATE;
 IF allowed IS NULL THEN RAISE EXCEPTION 'PACO_PROFILE_MISSING' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  SELECT count(*) INTO count_pets FROM public.paco_pets WHERE owner_id=NEW.owner_id AND id<>NEW.id;
  IF count_pets>=allowed THEN RAISE EXCEPTION 'PACO_PET_LIMIT' USING ERRCODE='23514'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM public.paco_memories WHERE pet_id=NEW.id AND event_date<NEW.birth_date) THEN RAISE EXCEPTION 'PACO_BIRTH_AFTER_MEMORY' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER paco_pet_rules BEFORE INSERT OR UPDATE ON public.paco_pets FOR EACH ROW EXECUTE FUNCTION public.paco_pet_rules();

CREATE FUNCTION public.paco_memory_rules() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE born date; allowed integer; count_memories integer;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.id<>OLD.id OR NEW.owner_id<>OLD.owner_id OR NEW.pet_id<>OLD.pet_id OR NEW.created_at<>OLD.created_at) THEN RAISE EXCEPTION 'PACO_IMMUTABLE' USING ERRCODE='23514'; END IF;
 SELECT max_memories INTO allowed FROM public.paco_profiles WHERE user_id=NEW.owner_id FOR UPDATE;
 SELECT birth_date INTO born FROM public.paco_pets WHERE id=NEW.pet_id AND owner_id=NEW.owner_id FOR UPDATE;
 IF born IS NULL THEN RAISE EXCEPTION 'PACO_NOT_FOUND' USING ERRCODE='23514'; END IF;
 IF NEW.event_date<born OR NEW.event_date>(now() AT TIME ZONE 'UTC')::date THEN RAISE EXCEPTION 'PACO_INVALID_DATE' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  SELECT count(*) INTO count_memories FROM public.paco_memories WHERE pet_id=NEW.pet_id AND id<>NEW.id;
  IF count_memories>=allowed THEN RAISE EXCEPTION 'PACO_MEMORY_LIMIT' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER paco_memory_rules BEFORE INSERT OR UPDATE ON public.paco_memories FOR EACH ROW EXECUTE FUNCTION public.paco_memory_rules();

ALTER TABLE public.paco_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paco_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paco_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read ON public.paco_profiles FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY pets_read ON public.paco_pets FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()));
CREATE POLICY pets_insert ON public.paco_pets FOR INSERT TO authenticated WITH CHECK(owner_id=(SELECT auth.uid()));
CREATE POLICY pets_update ON public.paco_pets FOR UPDATE TO authenticated USING(owner_id=(SELECT auth.uid())) WITH CHECK(owner_id=(SELECT auth.uid()));
CREATE POLICY memories_read ON public.paco_memories FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()));
CREATE POLICY memories_insert ON public.paco_memories FOR INSERT TO authenticated WITH CHECK(owner_id=(SELECT auth.uid()));
CREATE POLICY memories_update ON public.paco_memories FOR UPDATE TO authenticated USING(owner_id=(SELECT auth.uid())) WITH CHECK(owner_id=(SELECT auth.uid()));
REVOKE ALL ON public.paco_profiles,public.paco_pets,public.paco_memories FROM anon,authenticated;
GRANT SELECT ON public.paco_profiles,public.paco_pets,public.paco_memories TO authenticated;
GRANT INSERT(id,name,species,birth_date,estimated,breed,gender,weight) ON public.paco_pets TO authenticated;
GRANT UPDATE(name,species,birth_date,estimated,breed,gender,weight) ON public.paco_pets TO authenticated;
GRANT INSERT(id,pet_id,title,event_date,note) ON public.paco_memories TO authenticated;
GRANT UPDATE(title,event_date,note) ON public.paco_memories TO authenticated;
GRANT ALL ON public.paco_profiles,public.paco_pets,public.paco_memories TO service_role;
REVOKE ALL ON FUNCTION public.paco_new_user(),public.paco_pet_rules(),public.paco_memory_rules() FROM PUBLIC, anon, authenticated;
COMMIT;

