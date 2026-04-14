-- Event RSVP tracking: links Sanity churchEvent documents to portal members.
-- Title and slug are denormalized because events live in Sanity, not Postgres.

CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sanity_event_id text NOT NULL,
  sanity_event_slug text NOT NULL,
  sanity_event_title text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_rsvps_unique UNIQUE (sanity_event_id, user_id)
);

CREATE INDEX idx_event_rsvps_event ON public.event_rsvps (sanity_event_id);
CREATE INDEX idx_event_rsvps_user ON public.event_rsvps (user_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Members can see their own RSVPs
CREATE POLICY event_rsvps_select_own
  ON public.event_rsvps FOR SELECT
  USING (user_id = auth.uid());

-- Staff+ can see all RSVPs (admin dashboard / analytics)
CREATE POLICY event_rsvps_select_staff
  ON public.event_rsvps FOR SELECT
  USING (public.is_staff_or_above());

-- Members can RSVP for themselves
CREATE POLICY event_rsvps_insert_own
  ON public.event_rsvps FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Members can cancel their own RSVP
CREATE POLICY event_rsvps_delete_own
  ON public.event_rsvps FOR DELETE
  USING (user_id = auth.uid());

-- Staff+ can delete any RSVP (admin management)
CREATE POLICY event_rsvps_delete_staff
  ON public.event_rsvps FOR DELETE
  USING (public.is_staff_or_above());

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
GRANT ALL ON public.event_rsvps TO authenticated;
