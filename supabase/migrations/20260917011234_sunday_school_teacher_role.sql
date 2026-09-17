-- Commit the enum addition before the policies in the following migration.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sunday_school_teacher';
