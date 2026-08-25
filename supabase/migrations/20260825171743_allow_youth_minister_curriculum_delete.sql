-- Youth ministers can delete protected curriculum files without receiving
-- access to the rest of the church admin panel. Staff/executive/apostle remain
-- the upload/replace managers and may also delete curriculum.

DROP POLICY IF EXISTS youth_curriculum_select ON storage.objects;
DROP POLICY IF EXISTS youth_curriculum_insert ON storage.objects;
DROP POLICY IF EXISTS youth_curriculum_update ON storage.objects;
DROP POLICY IF EXISTS youth_curriculum_delete ON storage.objects;

CREATE POLICY youth_curriculum_select
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'youth-curriculum'
    AND (SELECT public.has_any_role(
      ARRAY[
        'youth_ministry',
        'youth_minister',
        'staff',
        'executive',
        'apostle'
      ]::public.app_role[]
    ))
  );

CREATE POLICY youth_curriculum_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'youth-curriculum'
    AND (SELECT public.is_staff_or_above())
  );

CREATE POLICY youth_curriculum_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'youth-curriculum'
    AND (SELECT public.is_staff_or_above())
  )
  WITH CHECK (
    bucket_id = 'youth-curriculum'
    AND (SELECT public.is_staff_or_above())
  );

CREATE POLICY youth_curriculum_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'youth-curriculum'
    AND (SELECT public.has_any_role(
      ARRAY['youth_minister', 'staff', 'executive', 'apostle']::public.app_role[]
    ))
  );
