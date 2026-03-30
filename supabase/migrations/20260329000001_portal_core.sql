-- Church portal: core enums, profiles, roles, helpers, RLS
-- Aligns with docs/portal/auth-and-rls.md

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM (
  'member',
  'ministry_leader',
  'staff',
  'executive',
  'apostle'
);

CREATE TYPE public.prayer_visibility AS ENUM (
  'pastoral_staff_only',
  'prayer_ministry',
  'public_praise_ok'
);

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  preferred_bible_version text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users (id),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE public.prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  visibility public.prayer_visibility NOT NULL DEFAULT 'pastoral_staff_only',
  title text,
  body text NOT NULL,
  is_anonymous_to_team boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prayer_body_not_empty CHECK (length(trim(body)) > 0)
);

CREATE TABLE public.personal_giving_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount_usd numeric(12, 2) NOT NULL CHECK (amount_usd > 0),
  category text NOT NULL,
  category_detail text,
  note_created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT personal_giving_category_nonempty CHECK (length(trim(category)) > 0)
);

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX idx_prayer_requests_user_id ON public.prayer_requests (user_id);
CREATE INDEX idx_prayer_requests_created_at ON public.prayer_requests (created_at DESC);
CREATE INDEX idx_personal_giving_notes_user_id ON public.personal_giving_notes (user_id);
CREATE INDEX idx_analytics_events_name_created ON public.analytics_events (name, created_at DESC);

-- -----------------------------------------------------------------------------
-- Triggers: updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER prayer_requests_updated_at
  BEFORE UPDATE ON public.prayer_requests
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER; fixed search_path)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(p_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = p_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(p_roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (p_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_above()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role (ARRAY['staff', 'executive', 'apostle']::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.is_executive_or_apostle()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role (ARRAY['executive', 'apostle']::public.app_role[]);
$$;

-- New signups: create profile + default member role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_giving_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_select_staff
  ON public.profiles FOR SELECT
  USING (public.is_staff_or_above());

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_staff
  ON public.profiles FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

-- user_roles
CREATE POLICY user_roles_select_own
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY user_roles_select_staff
  ON public.user_roles FOR SELECT
  USING (public.is_staff_or_above());

CREATE POLICY user_roles_insert_staff
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY user_roles_delete_staff
  ON public.user_roles FOR DELETE
  USING (public.is_staff_or_above());

-- prayer_requests
CREATE POLICY prayer_insert_authenticated
  ON public.prayer_requests FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

CREATE POLICY prayer_select_own
  ON public.prayer_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY prayer_select_staff_pastoral
  ON public.prayer_requests FOR SELECT
  USING (
    public.is_staff_or_above()
    AND visibility = 'pastoral_staff_only'
  );

CREATE POLICY prayer_select_staff_ministry
  ON public.prayer_requests FOR SELECT
  USING (
    public.is_staff_or_above()
    AND visibility = 'prayer_ministry'
  );

CREATE POLICY prayer_select_ministry_leader_ministry
  ON public.prayer_requests FOR SELECT
  USING (
    public.has_role('ministry_leader')
    AND visibility = 'prayer_ministry'
  );

CREATE POLICY prayer_select_staff_praise
  ON public.prayer_requests FOR SELECT
  USING (
    public.is_staff_or_above()
    AND visibility = 'public_praise_ok'
  );

CREATE POLICY prayer_update_staff
  ON public.prayer_requests FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

-- Members do not UPDATE submitted prayers (avoids visibility/tampering); submit a new request or ask staff.

-- personal_giving_notes (non-official member journal)
CREATE POLICY giving_notes_all_own
  ON public.personal_giving_notes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- analytics_events: insert own anonymous or identified; read staff+
CREATE POLICY analytics_insert_member
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY analytics_select_staff
  ON public.analytics_events FOR SELECT
  USING (public.is_staff_or_above());

CREATE POLICY analytics_select_own
  ON public.analytics_events FOR SELECT
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Grants (authenticated users)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.prayer_requests TO authenticated;
GRANT ALL ON public.personal_giving_notes TO authenticated;
GRANT ALL ON public.analytics_events TO authenticated;
