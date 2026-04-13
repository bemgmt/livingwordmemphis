-- Local Bible storage: translations, books, verses, Strong's, highlights, notes
-- Replaces external API.Bible dependency with locally-stored Bible text.
-- Depends on: 20260329000001_portal_core.sql (auth helpers, RLS functions)

-- -----------------------------------------------------------------------------
-- Enum for highlight colors
-- -----------------------------------------------------------------------------
CREATE TYPE public.highlight_color AS ENUM ('yellow', 'green', 'blue', 'pink', 'purple');

-- -----------------------------------------------------------------------------
-- Bible translations (replaces approved_bibles for local data)
-- -----------------------------------------------------------------------------
CREATE TABLE public.bible_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text NOT NULL,
  module text UNIQUE NOT NULL,
  year text,
  has_strongs boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bt_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT bt_module_not_empty CHECK (length(trim(module)) > 0)
);

-- -----------------------------------------------------------------------------
-- Bible books
-- -----------------------------------------------------------------------------
CREATE TABLE public.bible_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id uuid NOT NULL REFERENCES public.bible_translations (id) ON DELETE CASCADE,
  book_number smallint NOT NULL,
  name text NOT NULL,
  testament text NOT NULL,
  chapter_count smallint NOT NULL,
  UNIQUE (translation_id, book_number),
  CONSTRAINT bb_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT bb_testament_valid CHECK (testament IN ('OT', 'NT'))
);

CREATE INDEX idx_bible_books_translation ON public.bible_books (translation_id, book_number);

-- -----------------------------------------------------------------------------
-- Bible verses
-- -----------------------------------------------------------------------------
CREATE TABLE public.bible_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.bible_books (id) ON DELETE CASCADE,
  chapter smallint NOT NULL,
  verse smallint NOT NULL,
  text text NOT NULL,
  text_with_strongs text,
  fts tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
  UNIQUE (book_id, chapter, verse)
);

CREATE INDEX idx_bible_verses_book_chapter ON public.bible_verses (book_id, chapter, verse);
CREATE INDEX idx_bible_verses_fts ON public.bible_verses USING gin (fts);

-- -----------------------------------------------------------------------------
-- Strong's concordance definitions
-- -----------------------------------------------------------------------------
CREATE TABLE public.strongs_definitions (
  id text PRIMARY KEY,
  language text NOT NULL,
  lemma text,
  transliteration text,
  definition text NOT NULL,
  kjv_usage text,
  CONSTRAINT sd_language_valid CHECK (language IN ('hebrew', 'greek'))
);

-- -----------------------------------------------------------------------------
-- User verse highlights
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_verse_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  verse_id uuid NOT NULL REFERENCES public.bible_verses (id) ON DELETE CASCADE,
  color public.highlight_color NOT NULL DEFAULT 'yellow',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, verse_id)
);

CREATE INDEX idx_user_highlights_user ON public.user_verse_highlights (user_id);

-- -----------------------------------------------------------------------------
-- User verse notes
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_verse_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  verse_id uuid NOT NULL REFERENCES public.bible_verses (id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uvn_content_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX idx_user_notes_user ON public.user_verse_notes (user_id);
CREATE INDEX idx_user_notes_verse ON public.user_verse_notes (verse_id);

CREATE TRIGGER user_verse_notes_updated_at
  BEFORE UPDATE ON public.user_verse_notes
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- User reading position (tracks last-read location per translation)
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_reading_positions (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  translation_id uuid NOT NULL REFERENCES public.bible_translations (id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.bible_books (id) ON DELETE CASCADE,
  chapter smallint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, translation_id)
);

CREATE TRIGGER user_reading_positions_updated_at
  BEFORE UPDATE ON public.user_reading_positions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Full-text search function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_bible(
  p_query text,
  p_translation_id uuid,
  p_limit int DEFAULT 25
)
RETURNS TABLE (
  verse_id uuid,
  book_name text,
  book_number smallint,
  chapter smallint,
  verse smallint,
  text text,
  rank real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id AS verse_id,
    b.name AS book_name,
    b.book_number,
    v.chapter,
    v.verse,
    v.text,
    ts_rank(v.fts, websearch_to_tsquery('english', p_query)) AS rank
  FROM public.bible_verses v
  JOIN public.bible_books b ON b.id = v.book_id
  WHERE b.translation_id = p_translation_id
    AND v.fts @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC, b.book_number, v.chapter, v.verse
  LIMIT p_limit;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.bible_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strongs_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verse_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verse_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_positions ENABLE ROW LEVEL SECURITY;

-- Bible content: any authenticated user can read
CREATE POLICY bt_select ON public.bible_translations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY bb_select ON public.bible_books FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY bv_select ON public.bible_verses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY sd_select ON public.strongs_definitions FOR SELECT USING (auth.uid() IS NOT NULL);

-- Staff can manage translations
CREATE POLICY bt_insert_staff ON public.bible_translations FOR INSERT WITH CHECK (public.is_staff_or_above());
CREATE POLICY bt_update_staff ON public.bible_translations FOR UPDATE USING (public.is_staff_or_above()) WITH CHECK (public.is_staff_or_above());
CREATE POLICY bt_delete_staff ON public.bible_translations FOR DELETE USING (public.is_staff_or_above());

-- Highlights: users own their rows
CREATE POLICY highlights_select_own ON public.user_verse_highlights FOR SELECT USING (user_id = auth.uid());
CREATE POLICY highlights_insert_own ON public.user_verse_highlights FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY highlights_update_own ON public.user_verse_highlights FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY highlights_delete_own ON public.user_verse_highlights FOR DELETE USING (user_id = auth.uid());

-- Notes: users own their rows
CREATE POLICY notes_select_own ON public.user_verse_notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notes_insert_own ON public.user_verse_notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY notes_update_own ON public.user_verse_notes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notes_delete_own ON public.user_verse_notes FOR DELETE USING (user_id = auth.uid());

-- Reading positions: users own their rows
CREATE POLICY reading_pos_select_own ON public.user_reading_positions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY reading_pos_insert_own ON public.user_reading_positions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY reading_pos_update_own ON public.user_reading_positions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY reading_pos_delete_own ON public.user_reading_positions FOR DELETE USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
GRANT ALL ON public.bible_translations TO authenticated;
GRANT ALL ON public.bible_books TO authenticated;
GRANT ALL ON public.bible_verses TO authenticated;
GRANT ALL ON public.strongs_definitions TO authenticated;
GRANT ALL ON public.user_verse_highlights TO authenticated;
GRANT ALL ON public.user_verse_notes TO authenticated;
GRANT ALL ON public.user_reading_positions TO authenticated;
