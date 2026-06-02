-- ---------------------------------------------------------------------------
-- Content approval workflow: forum topics and prayer requests now require
-- admin approval before appearing to other members.
-- ---------------------------------------------------------------------------

-- ---- forum_topics: add approval columns ----
ALTER TABLE public.forum_topics
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- ---- prayer_requests: add approval columns ----
ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- ---- Auto-approve all existing content so nothing breaks ----
UPDATE public.forum_topics
  SET approval_status = 'approved', approved_at = now()
  WHERE approval_status = 'pending';

UPDATE public.prayer_requests
  SET approval_status = 'approved', approved_at = now()
  WHERE approval_status = 'pending';

-- ---- Indexes ----
CREATE INDEX IF NOT EXISTS idx_forum_topics_approval ON public.forum_topics (approval_status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_approval ON public.prayer_requests (approval_status);

-- ---------------------------------------------------------------------------
-- Tighten forum_topics SELECT: members only see approved OR own posts
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS forum_topics_select ON public.forum_topics;

CREATE POLICY forum_topics_select
  ON public.forum_topics FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      approval_status = 'approved'
      OR author_id = auth.uid()
      OR public.is_staff_or_above()
    )
  );

-- Staff can UPDATE approval fields on forum topics
CREATE POLICY forum_topics_approve_staff
  ON public.forum_topics FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

-- ---------------------------------------------------------------------------
-- Tighten prayer_requests SELECT: members only see their own (as before)
-- Staff+ sees all (existing policies already cover this, just adding approval)
-- ---------------------------------------------------------------------------
-- The existing prayer policies already limit members to their own rows.
-- We need to allow staff to UPDATE the approval fields.
CREATE POLICY prayer_approve_staff
  ON public.prayer_requests FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());
