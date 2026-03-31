# Living Word Memphis — Sanity Studio

Content types for public marketing and portal-aligned editorial workflows (see `docs/portal/data-ownership.md`).

## Content model

| Type | Purpose |
|------|---------|
| **Site settings** (singleton) | Site name, tagline, default OG image |
| **Sermon series** | Grouping for sermons |
| **Sermon** | Preached date, speaker, video/audio URLs, scripture tags, notes (Portable Text) |
| **Church event** | Start/end, location, summary, registration link |
| **Announcement** | Short updates with optional schedule window |
| **Knowledge base article** | Draft → review → approved → published (safe for future AI export) |

Shared: **`seo`** object, **`blockContent`** Portable Text (headings, lists, links).

## Setup

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage) and a dataset (e.g. `production`).

2. Copy `.env.example` to `.env` and set:

   - `SANITY_STUDIO_PROJECT_ID`
   - `SANITY_STUDIO_DATASET` (default `production`)

3. Install and run Studio:

   ```bash
   npm install
   npm run dev
   ```

4. Deploy schema to the cloud dataset (for hosted Studio / API):

   ```bash
   npx sanity@latest schema deploy
   ```

5. Match the Next app env (`member-portal/.env.local`): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and a read token for server fetches when you wire GROQ.

## Example GROQ (Next.js)

Published sermons (newest first):

```groq
*[_type == "sermon" && defined(slug.current)]
| order(preachedAt desc) [0...10] {
  _id,
  title,
  "slug": slug.current,
  preachedAt,
  speakerName,
  excerpt,
  videoUrl,
  coverImage,
  "seriesTitle": series->title
}
```

Upcoming events:

```groq
*[_type == "churchEvent" && startAt >= now()]
| order(startAt asc) [0...20] {
  _id,
  title,
  "slug": slug.current,
  startAt,
  endAt,
  location,
  summary,
  registrationUrl,
  image
}
```

Active announcements (optional date window):

```groq
*[_type == "announcement" &&
  (!defined(displayFrom) || displayFrom <= now()) &&
  (!defined(displayUntil) || displayUntil >= now())
] | order(priority desc) {
  _id,
  title,
  excerpt,
  linkUrl,
  linkLabel
}
```

Knowledge articles ready to surface publicly:

```groq
*[_type == "knowledgeArticle" && status == "published" && defined(slug.current)]
| order(_updatedAt desc) {
  _id,
  title,
  "slug": slug.current,
  summary,
  tags
}
```

Site settings singleton:

```groq
*[_id == "siteSettings"][0]{ title, tagline, defaultOgImage }
```
