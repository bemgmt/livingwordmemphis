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
- **`member-portal/`** — Next.js app: `/member/*`, `/admin/*`, magic-link auth, prayer + personal giving note flows.

## Next steps

1. Create a Supabase project and run migrations (CLI or SQL editor).
2. Copy `member-portal/.env.example` → `.env.local` with project URL + anon key.
3. Enable **Email** auth (magic link) in Supabase; add redirect URL `http://localhost:3000/auth/callback` (and production URL).
4. Grant staff roles by inserting into `user_roles` (service role or SQL).
