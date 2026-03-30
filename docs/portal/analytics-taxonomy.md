# Analytics event taxonomy

Event names are **stable contracts** between client, server, and dashboards. Use `snake_case` for `name`. Properties are JSON and must avoid PII in keys/values where possible.

## Storage

- Table: `public.analytics_events` (see migration).
- **Insert:** authenticated users (optional `user_id` null for “logged out” if ever allowed on public pages).
- **Read:** `staff+` for operational dashboards; users may read **own** rows only (for transparency/debug); executives rely on **aggregated** queries built in BI tools, not row-by-row PII exports.

## Core events (ship from day one)

| name | When fired | Suggested properties | Notes |
|------|------------|----------------------|--------|
| `portal_login` | Successful session established | `method` (magic_link, oauth, password) | No password in props. |
| `portal_logout` | User signs out | — | |
| `profile_view` | Member opens profile | — | |
| `profile_updated` | Profile save success | `fields` (array of field keys only, e.g. `["display_name"]`) | No values. |
| `profile_completion` | Completeness crosses threshold | `percent` (number) | |
| `group_list_view` | Opens group directory | — | Phase 2 when groups ship. |
| `group_join_request` | Request submitted | `group_id` (uuid) | |
| `serving_view` | Opens serving area | — | Phase 2. |
| `serving_signup` | Signs up for role | `role_id` | Phase 2. |
| `announcement_view` | Opens announcement | `announcement_id` | Sanity ID or slug. |
| `prayer_submitted` | Prayer created | `visibility` (enum string) | **Never** log `body` or title text. |
| `giving_note_saved` | Personal note saved (non-official) | `category` | **Never** log amount if policy says so; optional aggregate bucket only. |
| `sermon_resource_open` | Clicks sermon resource | `sermon_id` | |
| `admin_member_search` | Staff runs directory search | `result_count` (int) | **Never** log search query text if it could contain names/emails; hash or omit. |
| `dashboard_view` | Staff opens admin dashboard | `dashboard` (string id) | |

## Aggregates (executive / apostle)

Build in SQL or warehouse:

- Daily active users (count distinct `user_id` from `portal_login`).
- Prayer volume by `visibility` (from `prayer_submitted`).
- Profile completion distribution.
- Announcement unique views (from `announcement_view` distinct users).

## Visibility by role

| Data | Admin staff | Executive | Apostle |
|------|-------------|-----------|---------|
| Row-level events with `user_id` | Yes (operational) | Default **no**; use aggregates | Policy-based; teaching engagement aggregates OK |
| Search queries | Hashed / disabled | No raw text | No raw text |
| Giving-related events | Aggregates only | Aggregates | Summaries |

## Related

- [auth-and-rls.md](./auth-and-rls.md)
- [data-ownership.md](./data-ownership.md)
