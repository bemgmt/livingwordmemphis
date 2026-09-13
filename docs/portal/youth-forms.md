# Nursery registration and signed archives

Guardians use `/member/youth/forms`. Executive/apostle administrators use
`/admin/youth-forms`. A child belongs to the guardian account that adds them;
ordinary youth, youth-minister and staff roles do not grant cross-family archive access.

The initial template is nursery-specific. Additional ages require their own approved
questions and waiver. The archive roster includes only children guardians have added.

## Signing and persistence

Drafts live in `youth_children`; saving changed answers increments the revision.
Signing validates the complete draft and guardian consent, then snapshots the answers,
question labels, terms, signer, verified account email and server timestamp into
`youth_form_submissions`. The unique child/revision pair makes retries idempotent.
The server writes a PDF to private bucket `youth-signed-forms`, downloads it to verify
the stored bytes, and records its SHA-256 checksum before marking it completed.
If archiving fails, the saved signature remains pending with a retry control.
Updates require a new signed revision. Application roles cannot edit or delete signed
submissions or replace archived objects. This is application-level immutability, not
an object-lock/WORM storage guarantee against database or service-key administrators.

The PDF route uses the current user's session and RLS and verifies the checksum on
download. Staff pager and incident notes are not part of the signed guardian record;
no staff notes editor is included in this release.

## Configuration and operations

- Production requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  and server-only `SUPABASE_SERVICE_ROLE_KEY`.
- Migration: `supabase/migrations/20260912215627_youth_registration_archives.sql`.
  Applied transactionally to production project `xsyhacueggitnbwwudaq` on September
  12, 2026. This existing database has no Supabase CLI migration history table;
  reconcile historical migrations before using a blanket `supabase db push`.
- PDF generation bundles the OFL-licensed Noto Sans font. Unsupported glyphs are
  rejected before recording a signature, with instructions to contact the church.
- Run `npm run test:youth-forms` from `member-portal` for validation, PDF generation,
  and isolated Postgres permission/immutability tests. Samples are synthetic and
  written under ignored `test-results/youth-forms`.
- Database backups do not include Storage object bytes. A separate protected file
  backup and retention policy still needs to be configured by the church. No scheduled
  backup, email notification, or automatic archive retry worker is enabled by this release.

The typed name and consent record document electronic acknowledgment; this release
does not assert legal enforceability of the supplied waiver.
