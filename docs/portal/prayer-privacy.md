# Prayer requests: privacy, visibility, retention

Pastoral data requires explicit **visibility** and **retention** rules. This document matches `public.prayer_visibility` in Supabase migrations.

## Enum: `prayer_visibility`

| Value | Meaning | Who can read (RLS) |
|-------|---------|---------------------|
| `pastoral_staff_only` | Default. Sensitive; leadership and operational staff only. | `staff`, `executive`, `apostle` |
| `prayer_ministry` | Broader intercession team; still confidential. | Above + `ministry_leader` (scoped in future by team membership) |
| `public_praise_ok` | Member consents to **anonymized** public praise / bulletin use. No automatic public URL; staff still gate what is shared. | Staff+ for triage; **not** exposed on public site without separate publish step |

**Never** default new requests to `public_praise_ok`. UI must require explicit opt-in copy.

## Field: `is_anonymous_to_team`

When `true`, the **requester identity** is hidden from `ministry_leader` / prayer team views where policy allows (implementation: UI shows “Anonymous” and RLS or view layer omits `user_id` for non-staff). **Staff** may still see identity for safeguarding; document in church policy.

*MVP note:* Full anonymity in SQL views can be Phase 2; RLS currently allows requester and staff to see rows. Add a `SECURITY DEFINER` view or column-level rules when intercessor accounts exist.

## Retention and deletion

| Rule | Recommendation |
|------|----------------|
| Active triage | Keep while status is open (add `status` enum in Phase 2: `new`, `assigned`, `prayed`, `archived`). |
| Archived | Retain **24–36 months** unless local law or insurer requires longer; then archive or aggregate-only. |
| Deletion request | Member may request removal of non-legally-required records; **staff** executes via service role with audit log. |
| Backups | Supabase project backups; restrict access; do not use prayer text in AI training. |

## Submission workflow (MVP)

1. Authenticated member submits `title` (optional), `body` (required), `visibility`, `is_anonymous_to_team`.
2. No member **UPDATE** after submit (prevents tampering); corrections via staff or new submission.
3. Staff triage in admin UI (Phase 1 UI): list/filter by visibility and date.

## What must **not** enter AI or public channels

- Full prayer request body without explicit consent and redaction.
- Names + prayer content together in searchable AI KB.
- Bulk exports to third-party tools without DPA and purpose limitation.

## Legal / pastoral review

Before launch, have **church leadership** approve: visibility labels, who counts as “prayer team,” retention period, and children’s data policy if minors submit (recommend separate intake).

## Related

- [auth-and-rls.md](./auth-and-rls.md)
- [approval-workflows.md](./approval-workflows.md)
