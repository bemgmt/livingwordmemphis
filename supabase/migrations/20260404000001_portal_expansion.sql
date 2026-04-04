-- Portal expansion: bulletin, forum, groups, bibles, study assistant
-- Depends on: 20260329000001_portal_core.sql

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
CREATE TYPE public.group_type AS ENUM ('committee', 'ministry', 'study_group');
CREATE TYPE public.group_member_role AS ENUM ('leader', 'member');
CREATE TYPE public.join_request_status AS ENUM ('pending', 'approved', 'denied');
CREATE TYPE public.chat_role AS ENUM ('user', 'assistant');

-- -----------------------------------------------------------------------------
-- Alter profiles — richer member data
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text;

-- -----------------------------------------------------------------------------
-- Bulletin board
-- -----------------------------------------------------------------------------
CREATE TABLE public.bulletin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_announcement boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bulletin_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT bulletin_body_not_empty CHECK (length(trim(body)) > 0)
);

CREATE TABLE public.bulletin_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.bulletin_posts (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bulletin_comment_body_not_empty CHECK (length(trim(body)) > 0)
);

CREATE INDEX idx_bulletin_posts_created ON public.bulletin_posts (created_at DESC);
CREATE INDEX idx_bulletin_comments_post ON public.bulletin_comments (post_id, created_at);

CREATE TRIGGER bulletin_posts_updated_at
  BEFORE UPDATE ON public.bulletin_posts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Sermon forum
-- -----------------------------------------------------------------------------
CREATE TABLE public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id text,
  title text NOT NULL,
  body text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  is_locked boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT forum_topic_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT forum_topic_body_not_empty CHECK (length(trim(body)) > 0)
);

CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.forum_topics (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT forum_reply_body_not_empty CHECK (length(trim(body)) > 0)
);

CREATE INDEX idx_forum_topics_created ON public.forum_topics (created_at DESC);
CREATE INDEX idx_forum_replies_topic ON public.forum_replies (topic_id, created_at);

CREATE TRIGGER forum_topics_updated_at
  BEFORE UPDATE ON public.forum_topics
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER forum_replies_updated_at
  BEFORE UPDATE ON public.forum_replies
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Groups / committees
-- -----------------------------------------------------------------------------
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  group_type public.group_type NOT NULL DEFAULT 'ministry',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT groups_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT groups_slug_not_empty CHECK (length(trim(slug)) > 0)
);

CREATE TABLE public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.group_member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE public.group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status public.join_request_status NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES auth.users (id)
);

CREATE INDEX idx_group_members_user ON public.group_members (user_id);
CREATE INDEX idx_group_join_requests_group ON public.group_join_requests (group_id, status);
CREATE INDEX idx_group_join_requests_user ON public.group_join_requests (user_id);

-- -----------------------------------------------------------------------------
-- Approved Bibles
-- -----------------------------------------------------------------------------
CREATE TABLE public.approved_bibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text NOT NULL,
  api_bible_id text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  added_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bible_name_not_empty CHECK (length(trim(name)) > 0)
);

-- -----------------------------------------------------------------------------
-- Study assistant
-- -----------------------------------------------------------------------------
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Study',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.study_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.study_sessions (id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_sessions_user ON public.study_sessions (user_id, updated_at DESC);
CREATE INDEX idx_study_messages_session ON public.study_messages (session_id, created_at);

CREATE TRIGGER study_sessions_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.bulletin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_bibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_messages ENABLE ROW LEVEL SECURITY;

-- ----- bulletin_posts -----
CREATE POLICY bulletin_posts_select
  ON public.bulletin_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY bulletin_posts_insert
  ON public.bulletin_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
    AND (is_announcement = false OR public.is_staff_or_above())
  );

CREATE POLICY bulletin_posts_update_own
  ON public.bulletin_posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY bulletin_posts_update_staff
  ON public.bulletin_posts FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY bulletin_posts_delete_own
  ON public.bulletin_posts FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY bulletin_posts_delete_staff
  ON public.bulletin_posts FOR DELETE
  USING (public.is_staff_or_above());

-- ----- bulletin_comments -----
CREATE POLICY bulletin_comments_select
  ON public.bulletin_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY bulletin_comments_insert
  ON public.bulletin_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY bulletin_comments_delete_own
  ON public.bulletin_comments FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY bulletin_comments_delete_staff
  ON public.bulletin_comments FOR DELETE
  USING (public.is_staff_or_above());

-- ----- forum_topics -----
CREATE POLICY forum_topics_select
  ON public.forum_topics FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY forum_topics_insert
  ON public.forum_topics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY forum_topics_update_own
  ON public.forum_topics FOR UPDATE
  USING (author_id = auth.uid() AND is_locked = false)
  WITH CHECK (author_id = auth.uid());

CREATE POLICY forum_topics_update_staff
  ON public.forum_topics FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY forum_topics_delete_own
  ON public.forum_topics FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY forum_topics_delete_staff
  ON public.forum_topics FOR DELETE
  USING (public.is_staff_or_above());

-- ----- forum_replies -----
CREATE POLICY forum_replies_select
  ON public.forum_replies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY forum_replies_insert
  ON public.forum_replies FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.forum_topics t
      WHERE t.id = topic_id AND t.is_locked = true
    )
  );

CREATE POLICY forum_replies_update_own
  ON public.forum_replies FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY forum_replies_delete_own
  ON public.forum_replies FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY forum_replies_delete_staff
  ON public.forum_replies FOR DELETE
  USING (public.is_staff_or_above());

-- ----- groups -----
CREATE POLICY groups_select
  ON public.groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY groups_insert_staff
  ON public.groups FOR INSERT
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY groups_update_staff
  ON public.groups FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY groups_delete_staff
  ON public.groups FOR DELETE
  USING (public.is_staff_or_above());

-- ----- group_members -----
CREATE POLICY group_members_select
  ON public.group_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY group_members_insert_staff
  ON public.group_members FOR INSERT
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY group_members_delete_staff
  ON public.group_members FOR DELETE
  USING (public.is_staff_or_above());

-- ----- group_join_requests -----
CREATE POLICY join_requests_insert_own
  ON public.group_join_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY join_requests_select_own
  ON public.group_join_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY join_requests_select_staff
  ON public.group_join_requests FOR SELECT
  USING (public.is_staff_or_above());

CREATE POLICY join_requests_update_staff
  ON public.group_join_requests FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

-- ----- approved_bibles -----
CREATE POLICY bibles_select
  ON public.approved_bibles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY bibles_insert_staff
  ON public.approved_bibles FOR INSERT
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY bibles_update_staff
  ON public.approved_bibles FOR UPDATE
  USING (public.is_staff_or_above())
  WITH CHECK (public.is_staff_or_above());

CREATE POLICY bibles_delete_staff
  ON public.approved_bibles FOR DELETE
  USING (public.is_staff_or_above());

-- ----- study_sessions -----
CREATE POLICY study_sessions_select_own
  ON public.study_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY study_sessions_insert_own
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY study_sessions_update_own
  ON public.study_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY study_sessions_delete_own
  ON public.study_sessions FOR DELETE
  USING (user_id = auth.uid());

-- ----- study_messages -----
CREATE POLICY study_messages_select_own
  ON public.study_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY study_messages_insert_own
  ON public.study_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
GRANT ALL ON public.bulletin_posts TO authenticated;
GRANT ALL ON public.bulletin_comments TO authenticated;
GRANT ALL ON public.forum_topics TO authenticated;
GRANT ALL ON public.forum_replies TO authenticated;
GRANT ALL ON public.groups TO authenticated;
GRANT ALL ON public.group_members TO authenticated;
GRANT ALL ON public.group_join_requests TO authenticated;
GRANT ALL ON public.approved_bibles TO authenticated;
GRANT ALL ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_messages TO authenticated;
