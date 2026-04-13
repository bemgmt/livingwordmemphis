-- Seed the three approved Bible versions for the member portal Bible reader.
--
-- The KJV id below is the commonly assigned API.Bible ID for the
-- King James (Authorised) Version.  AMP and NLT are copyrighted and
-- their IDs are account-specific — replace the placeholders after
-- confirming availability on your API.Bible dashboard:
--   https://scripture.api.bible/admin
--
-- To find your IDs, run in any JS console with a valid key:
--   fetch('https://api.scripture.api.bible/v1/bibles',
--     { headers: { 'api-key': 'YOUR_KEY' } })
--     .then(r => r.json()).then(j => console.table(
--       j.data.filter(b => b.language.id === 'eng')
--         .map(b => ({ id: b.id, abbr: b.abbreviationLocal, name: b.nameLocal }))
--     ));

INSERT INTO public.approved_bibles (name, abbreviation, api_bible_id, is_active)
VALUES
  ('King James (Authorised) Version', 'KJV',  'de4e12af7f28f599-02', true),
  ('New Living Translation',          'NLT',  'd6e14a625393b4da-01', true),
  ('Amplified Bible',                 'AMP',  'a81b73293d3080c9-01', true),
  ('New King James Version',          'NKJV', '63097d2a0a2f7db3-01', true)
ON CONFLICT DO NOTHING;
