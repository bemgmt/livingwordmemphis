# Sanity CMS and the leadership portal

Staff reach the embedded Sanity Studio at **`/admin/studio`** after signing into the member portal with a Supabase account that has a **staff-level** role (`staff`, `executive`, or `apostle`). Portal auth (Supabase) and Sanity Studio auth are separate: editors must also be able to sign in to Sanity (invite them in [Sanity Manage](https://www.sanity.io/manage) for this project).

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `member-portal` (e.g. Vercel) | Sanity project ID; required for the embedded studio. |
| `NEXT_PUBLIC_SANITY_DATASET` | `member-portal` | Dataset name (often `production`). |
| `SANITY_STUDIO_PROJECT_ID` | `sanity/` CLI | Same project ID when running `sanity dev` / `sanity deploy` from the `sanity` package. |
| `SANITY_STUDIO_DATASET` | `sanity/` CLI | Same dataset as above. |
| `LWM_SANITY_TOKEN` | Server only (optional) | Read token for future server-side content fetching; not used by the studio UI. |

Keep **project ID and dataset identical** between `member-portal` and `sanity/` so schemas and content stay aligned.

## CORS and deployment

After deploying the portal, allow your site origin to call the Sanity API:

```bash
cd member-portal
npx sanity cors add https://your-production-domain.example --credentials
```

Add preview URLs if you use Vercel preview deployments.

## First Supabase staff user

`user_roles` inserts from normal clients require an existing staff user (RLS). Bootstrap the **first** staff row in the Supabase **SQL Editor** (service role bypasses RLS), using the user’s `auth.users.id`:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<uuid from auth.users>', 'staff')
ON CONFLICT DO NOTHING;
```

See [auth-and-rls.md](./auth-and-rls.md) for the role model. Additional roles can be granted by existing staff (if you add UI) or again via SQL / service role.

## Standalone Studio

The `sanity/` directory remains the place for `npm run dev` (port 3333 by default), `sanity deploy`, and `sanity schema deploy`, independent of Next.js.

## Related

- [auth-and-rls.md](./auth-and-rls.md) — Supabase roles and RLS
