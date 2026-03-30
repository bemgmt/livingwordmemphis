# Data ownership and system boundaries

Single reference for **where each kind of data lives** and which system is authoritative. Aligns with the strategic plan; update when integrations go live.

## Summary table

| Domain | Source of truth | Read replicas / caches | Notes |
|--------|-----------------|------------------------|--------|
| Identity & sessions | **Supabase Auth** (`auth.users`) | — | Portal login; magic link / OAuth per product choice. |
| Member profile (operational) | **Supabase** `public.profiles` | Client cache | Display name, prefs, contact fields policy allows. |
| Roles & permissions | **Supabase** `public.user_roles` | Optional JWT `app_metadata` mirror for UI only | RLS must use DB roles, not client claims alone. |
| Prayer requests | **Supabase** `public.prayer_requests` | — | Visibility enums in [prayer-privacy.md](./prayer-privacy.md). |
| Personal giving notes (non-official) | **Supabase** `public.personal_giving_notes` | Browser `localStorage` until user links account | **Not** tax/ledger data; Tithe.ly + church office are official. |
| Official giving / tax statements | **Tithe.ly + church finance** | Optional **Supabase** summaries via future sync | No portal write path to official ledger in MVP. |
| Public marketing pages | **Static site** / **Sanity** (when wired) | Vercel CDN | Keep one pipeline: either HTML repo or CMS. |
| Sermon notes & teaching content | **Sanity** (recommended) | Next.js fetches published docs | Apostle workflow publishes here. |
| Announcements (public) | **Sanity** *or* **Supabase** draft → publish | Public API / GROQ | Pick one bus; avoid two competing “published” truths. |
| AI knowledge base (curated) | **Sanity** (versioned docs) + **vector store** (Phase 2) | — | Only **approved** exports enter embeddings; see governance in strategic plan §6. |
| Transactional email | **Resend** | Logs in Resend dashboard | Invites, receipts (non-sensitive), prayer ack templates without prayer body. |
| Analytics events | **Supabase** `public.analytics_events` | Executive dashboards / future warehouse | Schema in [analytics-taxonomy.md](./analytics-taxonomy.md). |
| Deployment & secrets | **Vercel** env | — | Never commit secrets; use `.env.local` / Vercel project settings. |

## Boundaries (rules)

1. **Sanity** holds editorial and publishable narrative content (sermons, pages, AI-safe KB articles). It does **not** store raw prayer text or individual giving amounts tied to identity.
2. **Supabase** holds operational CRM-style data: profiles, roles, prayer pipeline, personal notes, analytics events. Enforce **RLS** on every table.
3. **Resend** sends mail; it is **not** a database. Templates must not embed highly sensitive pastoral content.
4. **Vercel** runs Next.js server code that may use the **service role** key only server-side to bypass RLS for audited admin jobs—never expose to the client.

## Decisions locked for MVP

| Topic | Decision |
|-------|----------|
| Announcements | **Defer** dedicated table; use Sanity or static site until portal feed is required. |
| Sermon notes | **Sanity** as source; portal links or embeds published content. |
| Giving official | **Tithe.ly** only; portal optional self-notes in Supabase (`personal_giving_notes`) + existing static flow. |
| Prayer | **Supabase** only; no duplication in Sanity. |
| AI KB | **Sanity** drafts + manual publish; vector index in Phase 2. |

## Related

- [auth-and-rls.md](./auth-and-rls.md)
- [approval-workflows.md](./approval-workflows.md)
