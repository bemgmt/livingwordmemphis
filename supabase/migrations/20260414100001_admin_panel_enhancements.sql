-- ---------------------------------------------------------------------------
-- Admin panel enhancements: executive+ read access on giving notes for
-- aggregated analytics, and content reporting table.
-- ---------------------------------------------------------------------------

-- Allow executive/apostle to read giving notes for dashboard analytics
CREATE POLICY giving_notes_read_executive
  ON public.personal_giving_notes FOR SELECT
  USING (public.is_executive_or_apostle());

-- ---------------------------------------------------------------------------
-- Content reports table for moderation
-- ---------------------------------------------------------------------------
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN (
    'bulletin_post', 'bulletin_comment', 'forum_topic', 'forum_reply'
  )),
  content_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'removed')),
  reviewed_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX idx_content_reports_status ON public.content_reports (status);
CREATE INDEX idx_content_reports_content ON public.content_reports (content_type, content_id);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Members can create reports on content they see
CREATE POLICY reports_insert_member
  ON public.content_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Members can view their own reports
CREATE POLICY reports_select_own
  ON public.content_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Staff+ can read all reports
CREATE POLICY reports_select_staff
  ON public.content_reports FOR SELECT
  USING (public.is_staff_or_above());

-- Staff+ can update report status
CREATE POLICY reports_update_staff
  ON public.content_reports FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

-- Staff+ can delete reports
CREATE POLICY reports_delete_staff
  ON public.content_reports FOR DELETE
  USING (public.is_staff_or_above());

GRANT ALL ON public.content_reports TO authenticated;
