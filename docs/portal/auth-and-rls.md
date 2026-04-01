# Authentication, roles, and Row Level Security (RLS)

This document is the **source of truth** for how the church portal maps people to permissions in Supabase. Implement RLS policies against these rules; keep this file updated when roles change.

## Role model (permission sets, not job titles)

Titles on an org chart (Apostle, Executive, Minister, Staff) map to **one or more** `app_role` values in `public.user_roles`. A user can hold multiple rows (for example `staff` + `ministry_leader`).

### `app_role` enum (database)

| Role | Purpose |
|------|---------|
| `member` | Default for every authenticated church member. Portal self-service. |
| `ministry_leader` | Scoped leadership (groups/serving in assigned areas). No automatic global PII. |
| `staff` | Day-to-day operations: directory, prayer triage, announcements queue, member support. |
| `executive` | Aggregated dashboards, strategic reports; **default-deny** for individual PII unless policy allows. |
| `apostle` | Highest-trust content and escalation (sermon notes pipeline, sensitive overrides per policy). |

**Public (unauthenticated)** is not stored; absence of session = public site only.

### Hierarchy (who wins in policy design)

When a policy says “staff or above,” it means any of: `staff`, `executive`, `apostle`.

When a policy says “executive or apostle,” `staff` is excluded.

`ministry_leader` is **orthogonal**: scoped by ministry/team assignment (future: `ministry_assignments` table). Until that table exists, treat `ministry_leader` like `member` for RLS except where explicitly documented.

### Effective permissions

At runtime:

1. Load `auth.uid()`.
2. Resolve roles from `public.user_roles` (not from JWT alone) so changes take effect without re-login where possible; optionally mirror hot roles in `app_metadata` for edge cases.
3. Use helper functions `public.has_role`, `public.has_any_role` (see migrations) inside RLS policies.

### JWT / `app_metadata` (optional mirror)

- **Recommended**: RLS uses `user_roles` + `auth.uid()` as primary truth.
- **Optional**: Sync a summary into `auth.users.raw_app_meta_data->roles` for client UI (badges, nav). Document that **RLS must not rely solely on client-writable claims**.

## Access matrix (summary)

| Resource | member | ministry_leader | staff | executive | apostle |
|----------|--------|-----------------|-------|-----------|---------|
| Own `profiles` row | read/update (non-privileged fields) | same | same | same | same |
| Other `profiles` | deny | deny (until scoped) | allow read (operational) | default deny individual; aggregates OK | policy-based |
| `user_roles` | read self | read self | read all; grant/revoke | read all; grant/revoke | read all; grant/revoke |
| `prayer_requests` | insert; read own | see prayer doc | triage per visibility | aggregates + policy | full per policy |
| `personal_giving_notes` | CRUD own | deny | deny (unless support impersonation policy) | aggregates only | — |
| Future: announcements drafts | — | scoped | yes | yes | publish approval |
| Future: AI KB drafts | deny | deny | propose | approve | approve |

## RLS implementation notes

- All portal tables live in `public` with **RLS enabled**.
- Use **least privilege**: default deny, explicit policies per operation (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- **Service role** bypasses RLS — use only in trusted server code (Vercel server actions, API routes, Edge functions), never in the browser.
- Add **audit columns** (`created_at`, `updated_at`, `created_by`) where mutations must be traceable.

## Onboarding new roles

1. Insert into `user_roles` (staff workflow or seed).
2. Verify policies with Supabase “RLS policy tests” or SQL as a test user.
3. Update this matrix if a new resource is added.

## Related documents

- [sanity-and-cms.md](./sanity-and-cms.md)
- [data-ownership.md](./data-ownership.md)
- [prayer-privacy.md](./prayer-privacy.md)
- [analytics-taxonomy.md](./analytics-taxonomy.md)
