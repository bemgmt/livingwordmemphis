# Living Word Memphis — web app (Next.js)

Next.js 15 app: **public marketing site** and **member / admin portal**, aligned with `docs/portal/*` and `supabase/migrations/`.

## Setup

1. From this directory:

   ```bash
   npm install
   ```

   On Windows, if `npm install` fails with `ENOTEMPTY`, close other tools using `node_modules`, delete the folder, and retry:

   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set at least `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. For production, set `NEXT_PUBLIC_PUBLIC_SITE_URL` to your canonical site origin (no trailing slash).

3. For the contact form, set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and a verified `CONTACT_FROM_EMAIL` (see [Resend](https://resend.com/docs)).

4. Apply database migrations (Supabase CLI linked to your project, or paste SQL from `../supabase/migrations/` into the SQL editor).

5. In Supabase **Authentication → URL configuration**, add redirect URLs:

   - `http://localhost:3000/auth/callback`
   - your production origin + `/auth/callback`

6. Run the dev server:

   ```bash
   npm run dev
   ```

## Deploy (Vercel)

Import the repo with **Root Directory** set to `member-portal`, add the same env vars, and deploy. Marketing and portal share one origin; **Member login** in the header links to `/auth/login`.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Public home |
| `/about`, `/events`, `/giving`, `/contact`, `/visitors` | Marketing pages |
| `/portal` | Portal hub (links to sign-in, member/admin areas, public site) |
| `/auth/login` | Magic link sign-in |
| `/auth/callback` | OAuth / email link handler |
| `/member/*` | Member area (auth required) |
| `/admin/*` | Staff dashboard (role required) |

## E2E tests

```bash
npx playwright install chromium
npm run test:e2e
```

## Windows production build note

If `npm run build` fails with `EISDIR: illegal operation on a directory, readlink`, try building from a **directory path without spaces** (or use WSL / Vercel). This is a known Webpack + Windows edge case on some volumes.

## Sanity CMS (optional)

Editorial content (sermons, events, announcements, knowledge base) is modeled in [`../sanity/`](../sanity/). Run Studio from that folder after setting `SANITY_STUDIO_*` in `sanity/.env`. Wire `NEXT_PUBLIC_SANITY_*` and a read token in this app when you add GROQ-powered pages.

## Legacy static HTML

Older static pages (`../index.html`, `../giving.html`, etc.) remain in the repo root for reference or a separate static host. **Next.js redirects** map `/*.html` to the new routes when served from this app. For a static-only deploy, configure `../js/portal-nav.js` with `MEMBER_PORTAL_ORIGIN_PRODUCTION` pointing at this Next.js deployment.
