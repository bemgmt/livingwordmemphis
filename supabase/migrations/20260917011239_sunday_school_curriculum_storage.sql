INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sunday-school-curriculum', 'sunday-school-curriculum', false, 52428800,
  ARRAY['application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation','video/mp4']);

-- Supabase anonymous accounts also have the authenticated role. Exclude them.
CREATE POLICY sunday_school_curriculum_read ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'sunday-school-curriculum'
  AND (SELECT auth.uid()) IS NOT NULL
  AND NOT COALESCE(((SELECT auth.jwt())->>'is_anonymous')::boolean, false)
);

-- Each teacher writes only to their own prefix. No overwrite policy is granted.
CREATE POLICY sunday_school_curriculum_insert ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'sunday-school-curriculum'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  AND NOT COALESCE(((SELECT auth.jwt())->>'is_anonymous')::boolean, false)
  AND public.has_any_role(ARRAY['sunday_school_teacher','staff','executive','apostle']::public.app_role[])
);

-- Administrative cleanup of unused objects; member and teacher downloads remain read-only.
CREATE POLICY sunday_school_curriculum_delete ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'sunday-school-curriculum'
  AND public.is_staff_or_above()
);
