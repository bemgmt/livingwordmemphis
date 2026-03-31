# Church portal documentation

Artifacts that implement the **Church portal expansion** plan (architecture, boundaries, workflows).

| Document | Purpose |
|----------|---------|
| [auth-and-rls.md](./auth-and-rls.md) | Roles, JWT notes, RLS access matrix |
| [data-ownership.md](./data-ownership.md) | Source of truth per domain (Supabase / Sanity / Resend / Tithe.ly) |
| [prayer-privacy.md](./prayer-privacy.md) | Prayer visibility enums, retention, governance |
| [approval-workflows.md](./approval-workflows.md) | Announcements, sermon notes, AI KB, role grants |
| [analytics-taxonomy.md](./analytics-taxonomy.md) | Event names and role visibility for dashboards |

## Code layout

- **`supabase/migrations/`** — Postgres schema, RLS, auth trigger for profiles + default `member` role.
- **`member-portal/`** — Next.js app: public marketing (`/`, `/about`, …), `/portal` hub, `/member/*`, `/admin/*`, magic-link auth, prayer + personal giving note flows, Resend-backed contact API.
- **`sanity/`** — Sanity Studio v3: sermons, series, events, announcements, knowledge-base articles, site settings. See [`sanity/README.md`](../sanity/README.md) for setup and GROQ examples.

## Next steps

1. Create a Supabase project and run migrations (CLI or SQL editor).
2. Copy `member-portal/.env.example` → `.env.local` with project URL + anon key and `NEXT_PUBLIC_PUBLIC_SITE_URL`.
3. Enable **Email** auth (magic link) in Supabase; add redirect URL `http://localhost:3000/auth/callback` (and production URL on the **same** origin as the public site when using the unified Next deploy).
4. Grant staff roles by inserting into `user_roles` (service role or SQL).
5. Configure Resend (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`) for public contact forms.
