-- Portal solidification: RLS fixes, new study tables, knowledge base cache
-- Depends on: 20260413000001_local_bibles.sql

-- =============================================================================
-- A1. Missing DELETE RLS policies
-- =============================================================================

-- Staff can delete prayer requests (admin moderation)
CREATE POLICY prayer_delete_staff
  ON public.prayer_requests FOR DELETE
  USING (public.is_staff_or_above());

-- Members can delete their own prayer requests
CREATE POLICY prayer_delete_own
  ON public.prayer_requests FOR DELETE
  USING (user_id = auth.uid());

-- Executive/apostle can remove member profiles
CREATE POLICY profiles_delete_executive
  ON public.profiles FOR DELETE
  USING (public.is_executive_or_apostle());

-- =============================================================================
-- A4. Unique constraint on approved_bibles.abbreviation (idempotent seed fix)
-- =============================================================================

-- Deduplicate any existing rows first (keep earliest)
DELETE FROM public.approved_bibles a
USING public.approved_bibles b
WHERE a.abbreviation = b.abbreviation
  AND a.created_at > b.created_at;

ALTER TABLE public.approved_bibles
  ADD CONSTRAINT approved_bibles_abbreviation_unique UNIQUE (abbreviation);

-- =============================================================================
-- B4. study_knowledge_base_cache (referenced by /api/study but never created)
-- =============================================================================

CREATE TABLE public.study_knowledge_base_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kb_title_not_empty CHECK (length(trim(title)) > 0)
);

CREATE TRIGGER study_kb_cache_updated_at
  BEFORE UPDATE ON public.study_knowledge_base_cache
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.study_knowledge_base_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY kb_cache_select_authenticated
  ON public.study_knowledge_base_cache FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY kb_cache_insert_staff
  ON public.study_knowledge_base_cache FOR INSERT
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY kb_cache_update_staff
  ON public.study_knowledge_base_cache FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY kb_cache_delete_staff
  ON public.study_knowledge_base_cache FOR DELETE
  USING (public.is_staff_or_above());

GRANT ALL ON public.study_knowledge_base_cache TO authenticated;

-- =============================================================================
-- C2. study_saved_scriptures (verses shared from Bible reader to Study)
-- =============================================================================

CREATE TABLE public.study_saved_scriptures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  verse_id uuid NOT NULL REFERENCES public.bible_verses (id) ON DELETE CASCADE,
  reference text NOT NULL,
  verse_text text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_saved_scriptures_user
  ON public.study_saved_scriptures (user_id, created_at DESC);

ALTER TABLE public.study_saved_scriptures ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_scriptures_select_own
  ON public.study_saved_scriptures FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY saved_scriptures_insert_own
  ON public.study_saved_scriptures FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY saved_scriptures_delete_own
  ON public.study_saved_scriptures FOR DELETE
  USING (user_id = auth.uid());

GRANT ALL ON public.study_saved_scriptures TO authenticated;

-- =============================================================================
-- D1. study_notes (sermon notes, free-form study notes)
-- =============================================================================

CREATE TABLE public.study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Note',
  content text NOT NULL,
  session_id uuid REFERENCES public.study_sessions (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_notes_content_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX idx_study_notes_user
  ON public.study_notes (user_id, updated_at DESC);

CREATE TRIGGER study_notes_updated_at
  BEFORE UPDATE ON public.study_notes
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY study_notes_select_own
  ON public.study_notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY study_notes_insert_own
  ON public.study_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY study_notes_update_own
  ON public.study_notes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY study_notes_delete_own
  ON public.study_notes FOR DELETE
  USING (user_id = auth.uid());

GRANT ALL ON public.study_notes TO authenticated;
