BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('paco-photos','paco-photos',false,8388608,ARRAY['image/jpeg'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=8388608,allowed_mime_types=ARRAY['image/jpeg'];
-- NO INSERT/UPDATE/DELETE policies for clients. Only trusted image processor writes.
CREATE POLICY paco_photos_read ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='paco-photos' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
COMMIT;

