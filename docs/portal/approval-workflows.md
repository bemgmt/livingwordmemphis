# Approval and review workflows (Phase 2+)

Design-only document for moderation and publishing. Not all steps are automated in MVP.

## 1. Church announcements (public)

**Goal:** Correct voice, accuracy, and timing before members/public see content.

| Stage | Actor | Action |
|-------|-------|--------|
| Draft | Staff / communications | Create in Sanity (or future `announcement_drafts` in Supabase). |
| Review | Staff lead or executive | Optional second pair of eyes for sensitive topics. |
| Publish | Authorized publisher | Publish in Sanity → site + portal feed update. |
| Emergency | Apostle / executive | Fast-path publish with post-hoc audit entry. |

**Escalation:** Doctrinal or controversial topics → Apostle visibility before publish (policy).

## 2. Sermon notes

| Stage | Actor | Action |
|-------|-------|--------|
| Draft | Apostle or delegated editor | Sanity document; not linked from portal until published. |
| Publish | Apostle (or delegate per policy) | Scheduled publish; optional member notification. |

## 3. Prayer requests

| Stage | Actor | Action |
|-------|-------|--------|
| Submit | Member | Immutable after submit (MVP). |
| Triage | Staff / prayer lead | Assign, mark prayed, archive (status field Phase 2). |
| Public praise | Staff | Only if `public_praise_ok` + redaction; separate “share” action. |

No volunteer should **approve** prayer for public display without staff oversight.

## 4. AI knowledge base ingestion

| Stage | Actor | Action |
|-------|-------|--------|
| Propose | Staff | New or updated Sanity doc in “AI review” state. |
| Review | Executive or designated theologian | Check accuracy, tone, no gossip/PII. |
| Approve | Executive + Apostle policy | Mark approved version; trigger embedding job (Phase 2). |
| Retire | Staff | Deprecate doc; re-embed or remove from index. |

**Never auto-ingest:** prayer logs, member profiles, giving details, leadership-only chats, counseling notes.

## 5. Ministry leader–scoped actions (future)

| Action | Scope |
|--------|--------|
| Roster view | Only assigned ministry IDs. |
| Serving assignments | Only teams under that ministry. |
| Group messaging | Per integration (email/Resend) with unsubscribe. |

Enforce via `ministry_assignments` table + RLS (not in MVP migration).

## 6. Member / staff role grants

| Action | Who |
|--------|-----|
| Grant `ministry_leader` | Staff+ |
| Grant `staff` | Executive or Apostle (policy) |
| Grant `executive` / `apostle` | Apostle + documented process |

All grants logged (`granted_by`, `granted_at` on `user_roles`).

## Related

- [data-ownership.md](./data-ownership.md)
- [analytics-taxonomy.md](./analytics-taxonomy.md)
