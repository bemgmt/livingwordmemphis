# Living Word Memphis — member portal (Next.js)

Next.js 15 app aligned with `docs/portal/*` and `supabase/migrations/`.

## Setup

1. From this directory, install dependencies:

   ```bash
   npm install
   ```

   On Windows, if `npm install` fails with `ENOTEMPTY`, close other tools using `node_modules`, delete the folder, and retry:

   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set Supabase URL + anon key.

3. Apply database migrations (Supabase CLI linked to your project, or paste SQL from `../supabase/migrations/` into the SQL editor).

4. In Supabase **Authentication → URL configuration**, add redirect URLs:

   - `http://localhost:3000/auth/callback`
   - your production origin + `/auth/callback`

5. Run the dev server:

   ```bash
   npm run dev
   ```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Portal entry |
| `/auth/login` | Magic link sign-in |
| `/auth/callback` | OAuth / email link handler |
| `/member/dashboard` | Member home |
| `/member/prayer` | Submit prayer request |
| `/member/giving` | Personal (non-official) giving note |
| `/admin/dashboard` | Staff dashboard (requires `staff`, `executive`, or `apostle` in `user_roles`) |

The static marketing site remains at the repo root (`index.html`, `giving.html`, etc.). Deploy this app as a **separate Vercel project** (import the same repo, set **Root Directory** to `member-portal`, add env vars, deploy). The marketing deployment does **not** serve `/auth/login`; that route exists only on this Next.js deployment.

After the portal has a production URL (e.g. `https://your-portal-name.vercel.app`), set `MEMBER_PORTAL_ORIGIN_PRODUCTION` at the top of `../js/portal-nav.js` so **Member login** on the static site points at the correct origin.
