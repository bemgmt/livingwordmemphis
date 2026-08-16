-- Secure youth curriculum files in a private Storage bucket.
-- Sanity remains the CMS and stores only the protected object path + metadata.

-- These SECURITY DEFINER helpers inspect auth.uid() for RLS. They must remain
-- available to signed-in sessions, but should not be callable by PUBLIC/anon.
REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_any_role(public.app_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff_or_above() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_executive_or_apostle() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_executive_or_apostle() TO authenticated;

-- Match database enforcement to the existing admin UI: only executive/apostle
-- users may grant or revoke application roles, and nobody may change their own
-- role rows through the Data API.
DROP POLICY IF EXISTS user_roles_insert_staff ON public.user_roles;
DROP POLICY IF EXISTS user_roles_delete_staff ON public.user_roles;

CREATE POLICY user_roles_insert_executive
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_executive_or_apostle()
    AND user_id <> (SELECT auth.uid())
    AND (granted_by IS NULL OR granted_by = (SELECT auth.uid()))
  );

CREATE POLICY user_roles_delete_executive
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    public.is_executive_or_apostle()
    AND user_id <> (SELECT auth.uid())
  );

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'youth-curriculum',
  'youth-curriculum',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS youth_curriculum_select ON storage.objects;
DROP POLICY IF EXISTS youth_curriculum_insert ON storage.objects;
DROP POLICY IF EXISTS youth_curriculum_update ON storage.objects;
DROP POLICY IF EXISTS youth_curriculum_delete ON storage.objects;

CREATE POLICY youth_curriculum_select
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'youth-curriculum'
    AND public.has_any_role(
      ARRAY['youth_ministry', 'staff', 'executive', 'apostle']::public.app_role[]
    )
  );

CREATE POLICY youth_curriculum_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'youth-curriculum'
    AND public.is_staff_or_above()
  );

CREATE POLICY youth_curriculum_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'youth-curriculum'
    AND public.is_staff_or_above()
  )
  WITH CHECK (
    bucket_id = 'youth-curriculum'
    AND public.is_staff_or_above()
  );

CREATE POLICY youth_curriculum_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'youth-curriculum'
    AND public.is_staff_or_above()
  );
