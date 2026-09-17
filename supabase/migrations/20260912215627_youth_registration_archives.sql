-- Guardians own their child records. Only executive/apostle administrators can
-- read across families. All writes pass through authenticated server actions.
create table public.youth_children (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users(id),
  display_name text not null check (length(display_name) between 1 and 200),
  draft jsonb not null default '{}'::jsonb check (jsonb_typeof(draft) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  unique(id, guardian_id)
);
create index youth_children_guardian_idx on public.youth_children(guardian_id);
create table public.youth_form_submissions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null,
  guardian_id uuid not null,
  revision integer not null check (revision > 0),
  form_version text not null,
  answers jsonb not null,
  terms jsonb not null,
  signature_name text not null check (length(signature_name) between 1 and 200),
  signer_email text not null,
  signed_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  storage_path text unique,
  pdf_sha256 text,
  archived_at timestamptz,
  foreign key (child_id, guardian_id) references public.youth_children(id, guardian_id),
  unique(child_id, revision),
  check ((status = 'pending' and storage_path is null and pdf_sha256 is null and archived_at is null)
    or (status = 'completed' and storage_path is not null and pdf_sha256 ~ '^[a-f0-9]{64}$' and archived_at is not null))
);
create index youth_forms_guardian_idx on public.youth_form_submissions(guardian_id);
create index youth_forms_signed_idx on public.youth_form_submissions(signed_at desc);
alter table public.youth_children enable row level security;
alter table public.youth_form_submissions enable row level security;
revoke all on public.youth_children, public.youth_form_submissions from public, anon, authenticated;
grant select on public.youth_children, public.youth_form_submissions to authenticated;
grant all on public.youth_children, public.youth_form_submissions to service_role;
create policy youth_children_read on public.youth_children for select to authenticated
  using (guardian_id = (select auth.uid()) or public.is_executive_or_apostle());
create policy youth_forms_read on public.youth_form_submissions for select to authenticated
  using (guardian_id = (select auth.uid()) or public.is_executive_or_apostle());

-- No SECURITY DEFINER: these functions retain the caller's privileges. Only
-- service_role may call the mutations, after server-side getUser/ownership checks.
create function public.freeze_youth_form(
  p_child uuid, p_guardian uuid, p_revision integer, p_version text,
  p_terms jsonb, p_signature text, p_email text
) returns public.youth_form_submissions language plpgsql security invoker set search_path = '' as $$
declare child public.youth_children; submission public.youth_form_submissions;
begin
  select * into child from public.youth_children where id = p_child and guardian_id = p_guardian for update;
  if not found then raise exception 'Child not found'; end if;
  select * into submission from public.youth_form_submissions where child_id = p_child and revision = p_revision;
  if found then return submission; end if;
  if child.revision <> p_revision or p_revision < 1 then raise exception 'Draft changed; review it again'; end if;
  insert into public.youth_form_submissions(child_id, guardian_id, revision, form_version, answers, terms, signature_name, signer_email)
    values(p_child, p_guardian, p_revision, p_version, child.draft, p_terms, p_signature, p_email)
    returning * into submission;
  return submission;
end $$;
revoke all on function public.freeze_youth_form(uuid, uuid, integer, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.freeze_youth_form(uuid, uuid, integer, text, jsonb, text, text) to service_role;

create function public.preserve_youth_submission() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'Signed submissions cannot be deleted through the application'; end if;
  if old.status = 'completed' or new.status <> 'completed'
    or (to_jsonb(new) - array['status','storage_path','pdf_sha256','archived_at'])
      is distinct from (to_jsonb(old) - array['status','storage_path','pdf_sha256','archived_at']) then
    raise exception 'Signed submissions are immutable';
  end if;
  return new;
end $$;
revoke all on function public.preserve_youth_submission() from public, anon, authenticated;
create trigger preserve_youth_submission before update or delete on public.youth_form_submissions
  for each row execute function public.preserve_youth_submission();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('youth-signed-forms', 'youth-signed-forms', false, 10485760, array['application/pdf']);
-- No client INSERT/UPDATE/DELETE policies: the server archives append-only PDFs.
-- Download authorization is checked again against the submission's guardian/admin.
create policy youth_signed_forms_read on storage.objects for select to authenticated
using (bucket_id = 'youth-signed-forms' and exists (
  select 1 from public.youth_form_submissions s
  where s.storage_path = storage.objects.name and s.status = 'completed'
    and (s.guardian_id = (select auth.uid()) or public.is_executive_or_apostle())
));
