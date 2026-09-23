BEGIN;

CREATE TABLE public.paco_vaccinations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 pet_id uuid NOT NULL,
 vaccine_name text NOT NULL CHECK(char_length(trim(vaccine_name)) BETWEEN 1 AND 100),
 administered_on date NOT NULL,
 next_due_on date,
 notes text NOT NULL DEFAULT '' CHECK(char_length(notes) <= 1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(pet_id,owner_id) REFERENCES public.paco_pets(id,owner_id) ON DELETE CASCADE,
 CHECK(next_due_on IS NULL OR next_due_on >= administered_on)
);

CREATE INDEX paco_vaccinations_pet_due ON public.paco_vaccinations(pet_id,next_due_on,administered_on DESC,id);
CREATE INDEX paco_vaccinations_pet_owner ON public.paco_vaccinations(pet_id,owner_id);
CREATE INDEX paco_vaccinations_owner_due ON public.paco_vaccinations(owner_id,next_due_on);

CREATE FUNCTION public.paco_vaccination_rules() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE born date; today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.id<>OLD.id OR NEW.owner_id<>OLD.owner_id OR NEW.pet_id<>OLD.pet_id OR NEW.created_at<>OLD.created_at) THEN
  RAISE EXCEPTION 'PACO_IMMUTABLE' USING ERRCODE='23514';
 END IF;
 SELECT birth_date INTO born FROM public.paco_pets WHERE id=NEW.pet_id AND owner_id=NEW.owner_id FOR KEY SHARE;
 IF born IS NULL THEN RAISE EXCEPTION 'PACO_NOT_FOUND' USING ERRCODE='23514'; END IF;
 IF NEW.administered_on<born OR NEW.administered_on>today THEN RAISE EXCEPTION 'PACO_INVALID_VACCINATION_DATE' USING ERRCODE='23514'; END IF;
 IF NEW.next_due_on IS NOT NULL AND NEW.next_due_on<NEW.administered_on THEN RAISE EXCEPTION 'PACO_INVALID_VACCINATION_DUE_DATE' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER paco_vaccination_rules BEFORE INSERT OR UPDATE ON public.paco_vaccinations FOR EACH ROW EXECUTE FUNCTION public.paco_vaccination_rules();

ALTER TABLE public.paco_vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY vaccinations_read ON public.paco_vaccinations FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()));
CREATE POLICY vaccinations_insert ON public.paco_vaccinations FOR INSERT TO authenticated WITH CHECK(owner_id=(SELECT auth.uid()));
CREATE POLICY vaccinations_update ON public.paco_vaccinations FOR UPDATE TO authenticated USING(owner_id=(SELECT auth.uid())) WITH CHECK(owner_id=(SELECT auth.uid()));
CREATE POLICY vaccinations_delete ON public.paco_vaccinations FOR DELETE TO authenticated USING(owner_id=(SELECT auth.uid()));
REVOKE ALL ON public.paco_vaccinations FROM anon,authenticated;
GRANT SELECT ON public.paco_vaccinations TO authenticated;
GRANT INSERT(id,pet_id,vaccine_name,administered_on,next_due_on,notes) ON public.paco_vaccinations TO authenticated;
GRANT UPDATE(vaccine_name,administered_on,next_due_on,notes) ON public.paco_vaccinations TO authenticated;
GRANT DELETE ON public.paco_vaccinations TO authenticated;
GRANT ALL ON public.paco_vaccinations TO service_role;
REVOKE ALL ON FUNCTION public.paco_vaccination_rules() FROM PUBLIC, anon, authenticated;
COMMIT;
