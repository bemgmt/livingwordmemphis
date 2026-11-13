-- Structured coursework and a private source library for the five approved schools.
create table public.som_library(
 id uuid primary key, offering_id text not null references public.som_offerings,
 title text not null, category text not null check(category in ('manual','workbook','weekly','handbook','instructor','forms','graduation','exams','practicum')),
 audience text not null check(audience in ('applicant','student','instructor','admin')),
 state text not null check(state in ('available','missing','review_required','draft')),
 edition text not null default '', notes text not null default '', source_hash text,
 filename text, updated_at timestamptz not null default now()
);
create table ministry_private.library_files(
 document_id uuid primary key references public.som_library on delete cascade,
 bucket text not null default 'ministry-curriculum',path text not null unique,
 mime text not null,size bigint not null,ready boolean not null default true
);
create table ministry_private.library_pending_files(
 id uuid primary key default gen_random_uuid(),document_id uuid not null references public.som_library,
 owner_id uuid not null references auth.users,bucket text not null default 'ministry-curriculum',
 path text not null unique,mime text not null,size bigint not null check(size between 1 and 52428800),
 filename text not null,ready boolean not null default false,source_hash text,created_at timestamptz not null default now()
);
create table ministry_private.library_versions(
 id bigint generated always as identity primary key,document_id uuid not null references public.som_library,
 path text not null,filename text not null,source_hash text,actor uuid not null references auth.users,created_at timestamptz not null default now()
);
alter table ministry_private.library_pending_files enable row level security;
alter table ministry_private.library_versions enable row level security;
revoke all on ministry_private.library_pending_files,ministry_private.library_versions from public,anon,authenticated;
create table public.som_units(
 id text primary key,offering_id text not null references public.som_offerings,
 kind text not null check(kind in ('chapter','week','practicum','portfolio','application')),
 number integer not null,title text not null,state text not null check(state in ('available','missing','review_required')),
 source_document_id uuid references public.som_library,source_version text not null,
 assignment_id uuid unique references public.som_content,meeting_id text references public.som_meetings,
 chapters integer[] not null default '{}',notes text not null default ''
);
create table ministry_private.unit_content(
 unit_id text primary key references public.som_units on delete cascade,
 reading text not null default '',instructions text not null default '',
 fields jsonb not null default '[]',source_sections jsonb not null default '{}'
);
create table ministry_private.unit_drafts(
 unit_id text primary key references public.som_units on delete cascade,
 data jsonb not null,actor uuid not null references auth.users,updated_at timestamptz not null default now()
);
create table public.som_records(
 id uuid primary key default gen_random_uuid(),offering_id text not null references public.som_offerings,
 user_id uuid not null references auth.users,
 kind text not null check(kind in ('application','reference','admission_review','orientation','practicum','remediation','readiness','completion','certificate','concern','request','case_note')),
 unit_id text references public.som_units,status text not null check(status in ('draft','submitted','complete','revision_required','open','closed')),
 data jsonb not null default '{}',created_by uuid not null references auth.users,
 updated_by uuid not null references auth.users,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index som_certificate_number on public.som_records(upper(trim(data->>'certificate_number')))
where kind='certificate' and status='complete';
create unique index som_single_application on public.som_records(offering_id,user_id,kind) where kind in ('application','orientation');
create table ministry_private.record_history(
 id bigint generated always as identity primary key,record_id uuid not null references public.som_records,
 actor uuid not null references auth.users,data jsonb not null,status text not null,recorded_at timestamptz not null default now()
);
alter table ministry_private.record_history enable row level security;
revoke all on ministry_private.record_history from public,anon,authenticated;
create function ministry_private.keep_record_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into ministry_private.record_history(record_id,actor,data,status) values(old.id,new.updated_by,old.data,old.status);
 return new;
end $$;
revoke all on function ministry_private.keep_record_history() from public,anon,authenticated;
create trigger som_record_history before update on public.som_records for each row execute function ministry_private.keep_record_history();
alter table public.som_work add column assessment_snapshot jsonb not null default '{}';
alter table public.som_grades alter column score drop not null;
alter table public.som_grades add column completion_status text check(completion_status in ('complete','revision_required'));
create function ministry_private.read_course(o text) returns boolean language sql stable as $$
 select ministry_private.signed_in() and (ministry_private.admin() or ministry_private.editor() or ministry_private.teaches(o) or ministry_private.enrolled(o))
$$;
create function ministry_private.read_document(d uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.som_library l where l.id=d and ministry_private.signed_in() and (
 ministry_private.admin() or
 (l.audience<>'admin' and ministry_private.editor()) or
 (l.audience<>'admin' and ministry_private.teaches(l.offering_id)) or
 (l.state<>'draft' and l.audience='student' and ministry_private.enrolled(l.offering_id)) or
 (l.state<>'draft' and l.audience='applicant' and exists(select 1 from public.som_enrollments e where e.offering_id=l.offering_id and e.user_id=auth.uid() and e.status in ('pending','approved','completed')))
 ))
$$;
create function ministry_private.library_path(p text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from ministry_private.library_files f join public.som_library l on l.id=f.document_id
 where f.path=p and f.ready and ministry_private.read_document(l.id) and
 (l.state='available' or ministry_private.admin() or ministry_private.editor() or ministry_private.teaches(l.offering_id)))
$$;
create function ministry_private.library_upload_path(p text) returns boolean language sql stable security definer set search_path='' as $$
 select ministry_private.signed_in() and exists(select 1 from ministry_private.library_pending_files f join public.som_library l on l.id=f.document_id
 where f.path=p and f.owner_id=auth.uid() and (ministry_private.admin() or (l.audience<>'admin' and ministry_private.editor())))
$$;
revoke all on function ministry_private.library_upload_path(text) from public,anon;
grant execute on function ministry_private.library_upload_path(text) to authenticated;
revoke all on function ministry_private.read_course(text),ministry_private.read_document(uuid),ministry_private.library_path(text) from public,anon;
grant execute on function ministry_private.read_course(text),ministry_private.read_document(uuid),ministry_private.library_path(text) to authenticated;
alter table public.som_library enable row level security;
alter table public.som_units enable row level security;
alter table public.som_records enable row level security;
alter table ministry_private.library_files enable row level security;
alter table ministry_private.unit_content enable row level security;
alter table ministry_private.unit_drafts enable row level security;
revoke all on public.som_library,public.som_units,public.som_records from anon,authenticated;
grant select on public.som_library,public.som_units,public.som_records to authenticated;
revoke all on ministry_private.library_files,ministry_private.unit_content,ministry_private.unit_drafts from public,anon,authenticated;
create policy som_library_read on public.som_library for select to authenticated using(ministry_private.read_document(id));
create policy som_unit_read on public.som_units for select to authenticated using(ministry_private.read_course(offering_id) or (kind='application' and exists(select 1 from public.som_enrollments e where e.offering_id=som_units.offering_id and e.user_id=auth.uid() and e.status in ('pending','approved','completed'))));
create policy som_record_read on public.som_records for select to authenticated using(
 ministry_private.signed_in() and (
 ministry_private.admin() or
 (kind in ('practicum','remediation','readiness') and ministry_private.teaches(offering_id)) or
 (user_id=auth.uid() and kind in ('application','orientation','practicum','remediation','completion','certificate','concern','request'))
 ));
create function public.ministry_record_versions(record uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r public.som_records;result jsonb;
begin
 select * into r from public.som_records where id=record;
 if not found or not ministry_private.signed_in() or not (
  ministry_private.admin() or
  (r.kind in ('practicum','remediation','readiness') and ministry_private.teaches(r.offering_id)) or
  (r.user_id=auth.uid() and r.kind in ('application','orientation','practicum','remediation','completion','certificate','concern','request'))
 ) then raise exception 'Record history unavailable.';end if;
 select coalesce(jsonb_agg(jsonb_build_object('data',h.data,'status',h.status,'recorded_at',h.recorded_at) order by h.id desc),'[]') into result from ministry_private.record_history h where h.record_id=r.id;
 return result;
end $$;
revoke all on function public.ministry_record_versions(uuid) from public,anon;
grant execute on function public.ministry_record_versions(uuid) to authenticated;
create policy som_library_storage_read on storage.objects for select to authenticated
using(bucket_id='ministry-curriculum' and (ministry_private.library_path(name) or ministry_private.library_upload_path(name)));
create policy som_library_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='ministry-curriculum' and ministry_private.library_upload_path(name));

create function public.ministry_unit_detail(unit text, draft boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare u public.som_units;b ministry_private.unit_content;d jsonb;
begin
 select * into u from public.som_units where id=unit;
 if not found or not (ministry_private.read_course(u.offering_id) or (u.kind='application' and exists(select 1 from public.som_enrollments e where e.offering_id=u.offering_id and e.user_id=auth.uid() and e.status in ('pending','approved','completed')))) then raise exception 'This chapter is not available for your school.';end if;
 if draft then
  if not ministry_private.editor() then raise exception 'Curriculum editor access required.';end if;
  select data into d from ministry_private.unit_drafts where unit_id=u.id;
  if d is not null then return to_jsonb(u)||d||jsonb_build_object('draft',true);end if;
 end if;
 select * into b from ministry_private.unit_content where unit_id=u.id;
 return to_jsonb(u)||jsonb_build_object('reading',coalesce(b.reading,''),'instructions',case when u.state='available' or ministry_private.editor() or ministry_private.manages(u.offering_id) then coalesce(b.instructions,'') else 'Workbook questions are awaiting reconciliation with the controlling manual. Use the released weekly assignment while this chapter is reviewed.' end,
  'fields',case when u.state='available' or ministry_private.editor() or ministry_private.manages(u.offering_id) then coalesce(b.fields,'[]') else '[]'::jsonb end,
  'source_sections',coalesce(b.source_sections,'{}'),'draft',false);
end $$;
create function public.ministry_library_file(document uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare l public.som_library;f ministry_private.library_files;
begin
 select * into l from public.som_library where id=document;
 if not found or not ministry_private.read_document(document) then raise exception 'Document unavailable.';end if;
 select * into f from ministry_private.library_files where document_id=document;
 if not found or not ministry_private.library_path(f.path) then raise exception 'This material is being prepared.';end if;
 return jsonb_build_object('bucket',f.bucket,'path',f.path,'filename',l.filename,'mime',f.mime);
end $$;
revoke all on function public.ministry_unit_detail(text,boolean),public.ministry_library_file(uuid) from public,anon;
grant execute on function public.ministry_unit_detail(text,boolean),public.ministry_library_file(uuid) to authenticated;
create function public.ministry_library_upload(upload uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare f ministry_private.library_pending_files;
begin
 select * into f from ministry_private.library_pending_files where id=upload;
 if not found or not ministry_private.library_upload_path(f.path) then raise exception 'Library upload unavailable.';end if;
 return to_jsonb(f);
end $$;
revoke all on function public.ministry_library_upload(uuid) from public,anon;
grant execute on function public.ministry_library_upload(uuid) to authenticated;

-- Frozen questions preserve the meaning of every submitted answer across later edits.
create function ministry_private.workbook_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
declare a public.som_content;u public.som_units;b ministry_private.unit_content;f jsonb;k text;v jsonb;
begin
 select * into a from public.som_content where id=new.assessment_id;
 if a.data->>'unit_id' is null then return new;end if;
 if TG_OP='INSERT' and new.assessment_snapshot<>'{}'::jsonb then
  if not ministry_private.manages(new.offering_id) or not exists(select 1 from public.som_work previous where previous.user_id=new.user_id and previous.assessment_id=new.assessment_id and previous.status='submitted' and previous.assessment_snapshot=new.assessment_snapshot) then raise exception 'Only an instructor-authorized revision can reuse a saved assignment version.';end if;
 elsif TG_OP='UPDATE' and old.assessment_snapshot<>'{}'::jsonb then
  if new.assessment_snapshot<>old.assessment_snapshot or new.assessment_id<>old.assessment_id or new.user_id<>old.user_id or new.offering_id<>old.offering_id then
   raise exception 'The saved assignment version cannot change.';end if;
  if old.status='submitted' and (new.answers<>old.answers or new.response<>old.response or new.status<>old.status) then
   raise exception 'Submitted work is read-only. Request an instructor-authorized revision.';end if;
 else
  select * into u from public.som_units where id=a.data->>'unit_id';
  if not found or u.state<>'available' or u.assignment_id<>a.id then raise exception 'This workbook is awaiting curriculum review.';end if;
  select * into b from ministry_private.unit_content where unit_id=u.id;
  new.assessment_snapshot:=jsonb_build_object('title',a.title,'unit_id',u.id,'source_version',u.source_version,'fields',b.fields,'instructions',b.instructions);
 end if;
 if jsonb_typeof(new.answers)<>'object' or octet_length(new.answers::text)>200000 then raise exception 'Invalid workbook responses.';end if;
 for k,v in select key,value from jsonb_each(new.answers) loop
  if jsonb_typeof(v)<>'string' or length(v#>>'{}')>20000 then raise exception 'Each response must be text of at most 20,000 characters.';end if;
  if not exists(select 1 from jsonb_array_elements(new.assessment_snapshot->'fields') q where q->>'id'=k) then raise exception 'Unknown assignment question.';end if;
 end loop;
 if new.status='submitted' then
  for f in select value from jsonb_array_elements(new.assessment_snapshot->'fields') loop
   if coalesce((f->>'required')::boolean,false) and nullif(trim(new.answers->>(f->>'id')),'') is null then raise exception 'Answer the required questions before submitting.';end if;
  end loop;
  if not exists(select 1 from jsonb_each_text(new.answers) where length(trim(value))>0) then raise exception 'Add a response before submitting.';end if;
 end if;
 return new;
end $$;
revoke all on function ministry_private.workbook_snapshot() from public,anon,authenticated;
create trigger som_workbook_snapshot before insert or update on public.som_work for each row execute function ministry_private.workbook_snapshot();
create function ministry_private.keep_workbook_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if old.data->>'unit_id' is not null and (
  new.data->>'unit_id' is distinct from old.data->>'unit_id' or
  new.data->>'grading_mode' is distinct from old.data->>'grading_mode' or
  new.kind<>old.kind or new.offering_id<>old.offering_id
 ) then raise exception 'Use the curriculum workbook editor to revise an imported assignment.';end if;
 return new;
end $$;
revoke all on function ministry_private.keep_workbook_identity() from public,anon,authenticated;
create trigger som_keep_workbook_identity before update on public.som_content for each row execute function ministry_private.keep_workbook_identity();

-- Assignments without a due date are not late. Examination behavior is unchanged.
create or replace function ministry_private.finish_work(w uuid,at_time timestamptz default now()) returns void language plpgsql security definer set search_path='' as $$
declare a public.som_content;s public.som_work;q jsonb;points numeric:=0;keys jsonb;has_written boolean:=false;
begin
 select * into s from public.som_work where id=w for update;
 if s.status='submitted' then return;end if;
 select * into a from public.som_content where id=s.assessment_id;
 update public.som_work set status='submitted',submitted_at=at_time,late=coalesce(a.kind='assignment' and (a.data->>'due_at')::timestamptz<at_time,false) where id=w;
 if a.kind='exam' then
  select answers into keys from ministry_private.answer_keys where assessment_id=a.id;
  for q in select value from jsonb_array_elements(coalesce(a.data->'questions','[]')) loop
   if q->>'type'='written' then has_written:=true;
   elsif s.answers->>(q->>'id')=keys->>(q->>'id') then points:=points+(q->>'points')::numeric;end if;
  end loop;
  insert into public.som_grades(work_id,score,feedback,released) values(w,points,case when has_written then 'Written responses await instructor grading.' else 'Multiple-choice scoring complete.' end,false) on conflict do nothing;
 end if;
end $$;

create function ministry_private.completion_grade_only() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.som_work w join public.som_content a on a.id=w.assessment_id where w.id=new.work_id and a.data->>'grading_mode'='completion') then
  if new.score is not null or new.completion_status is null then raise exception 'Use completion feedback for workbook assignments; points have not been assigned.';end if;
 end if;
 return new;
end $$;
revoke all on function ministry_private.completion_grade_only() from public,anon,authenticated;
create trigger som_completion_grade before insert or update on public.som_grades for each row execute function ministry_private.completion_grade_only();

create function public.ministry_course_command(action text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
<<course>>
declare uid uuid:=auth.uid();a public.som_content;w public.som_work;u public.som_units;r public.som_records;l public.som_library;upload ministry_private.library_pending_files;oldfile ministry_private.library_files;
 rid uuid;latest integer;result jsonb;d jsonb;f jsonb;k text;v jsonb;o text:=payload->>'offering_id';student uuid;kind text:=payload->>'kind';state text:=payload->>'status';
begin
 if not ministry_private.signed_in() then raise exception 'Sign in with a church account.';end if;
 if octet_length(payload::text)>250000 then raise exception 'Request is too large.';end if;
 if action='library_prepare' then
  select * into l from public.som_library where public.som_library.id=(payload->>'document_id')::uuid;
  if not found or not (ministry_private.admin() or (l.audience<>'admin' and ministry_private.editor())) then raise exception 'Curriculum editor access required.';end if;
  if coalesce((payload->>'size')::bigint,0) not between 1 and 52428800 or payload->>'mime' not in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document') or nullif(trim(payload->>'filename'),'') is null then raise exception 'Choose a Word document or PDF up to 50 MB.';end if;
  rid:=gen_random_uuid();
  insert into ministry_private.library_pending_files(id,document_id,owner_id,path,mime,size,filename)
   values(rid,l.id,uid,uid::text||'/library-drafts/'||rid::text,payload->>'mime',(payload->>'size')::bigint,payload->>'filename') returning * into upload;
  return jsonb_build_object('id',rid,'bucket',upload.bucket,'path',upload.path,'mime',upload.mime);
 elsif action in ('library_finish','library_publish') then
  select * into upload from ministry_private.library_pending_files where ministry_private.library_pending_files.id=(payload->>'id')::uuid for update;
  if not found or not ministry_private.library_upload_path(upload.path) then raise exception 'Curriculum editor access to your upload is required.';end if;
  if not exists(select 1 from storage.objects where bucket_id=upload.bucket and name=upload.path and (metadata->>'size')::bigint=upload.size and metadata->>'mimetype'=upload.mime) then raise exception 'The stored file could not be verified.';end if;
  if action='library_finish' then
   update ministry_private.library_pending_files set ready=true,source_hash=payload->>'source_hash' where ministry_private.library_pending_files.id=upload.id;
  else
   if not upload.ready then raise exception 'Finish uploading and preview the file before publishing.';end if;
   select * into l from public.som_library where public.som_library.id=upload.document_id for update;
   select * into oldfile from ministry_private.library_files where document_id=l.id;
   if oldfile.document_id is not null then insert into ministry_private.library_versions(document_id,path,filename,source_hash,actor) values(l.id,oldfile.path,coalesce(l.filename,''),l.source_hash,uid);end if;
   insert into ministry_private.library_files(document_id,bucket,path,mime,size) values(l.id,upload.bucket,upload.path,upload.mime,upload.size)
   on conflict(document_id) do update set path=excluded.path,mime=excluded.mime,size=excluded.size,bucket=excluded.bucket,ready=true;
   update public.som_library set state='available',filename=upload.filename,source_hash=upload.source_hash,edition='Editor-published revision',notes='Source document supplied. Chapter text and assignments have their own publication controls.',updated_at=now() where public.som_library.id=l.id;
   if l.category='manual' then update public.som_units set notes='Manual reference added to the school library. Chapter web reading is being prepared.' where offering_id=l.offering_id and notes like 'Full student manual not supplied.%';end if;
   delete from ministry_private.library_pending_files where ministry_private.library_pending_files.id=upload.id;
  end if;
  rid:=upload.id;
 elsif action in ('workbook_save','workbook_submit') then
  select * into a from public.som_content where id=(payload->>'assessment_id')::uuid;
  if not found or not a.published or a.data->>'unit_id' is null or not ministry_private.enrolled(a.offering_id,true) then raise exception 'Active enrollment and a released workbook are required.';end if;
  perform pg_advisory_xact_lock(hashtext(uid::text||a.id::text));
  select * into w from public.som_work where assessment_id=a.id and user_id=uid order by attempt desc limit 1 for update;
  if w.status='submitted' and action='workbook_submit' then return jsonb_build_object('id',w.id,'saved_at',w.saved_at,'submitted',true);end if;
  if w.status='submitted' then raise exception 'Submitted work is read-only.';end if;
  if w.id is not null and (payload->>'expected_saved_at')::timestamptz is distinct from w.saved_at then
   if w.answers=coalesce(payload->'answers','{}') then return jsonb_build_object('id',w.id,'saved_at',w.saved_at);end if;
   raise exception 'A newer draft exists. Reload this assignment before saving again.';end if;
  result:=public.ministry_command(case when action='workbook_submit' then 'submit_work' else 'save_work' end,payload);
  select * into w from public.som_work where id=(result->>'id')::uuid;
  return result||jsonb_build_object('saved_at',w.saved_at,'submitted',w.status='submitted');
 elsif action='workbook_grade' then
  select * into w from public.som_work where id=(payload->>'id')::uuid for update;
  select * into a from public.som_content where id=w.assessment_id;
  if not found or not ministry_private.manages(w.offering_id) or w.status<>'submitted' or a.data->>'grading_mode'<>'completion' then raise exception 'Assigned instructor access to submitted workbook work is required.';end if;
  insert into public.som_grades(work_id,score,feedback,released,completion_status) values(w.id,null,coalesce(payload->>'feedback',''),coalesce((payload->>'released')::boolean,false),payload->>'completion_status')
  on conflict(work_id) do update set score=null,feedback=excluded.feedback,released=excluded.released,completion_status=excluded.completion_status,updated_at=now();
  rid:=w.id;
 elsif action='workbook_revision' then
  select * into w from public.som_work where id=(payload->>'id')::uuid for update;
  select * into a from public.som_content where id=w.assessment_id;
  if not found or not ministry_private.manages(w.offering_id) or w.status<>'submitted' or a.data->>'unit_id' is null then raise exception 'An assigned instructor must authorize a revision.';end if;
  perform pg_advisory_xact_lock(hashtext(w.user_id::text||a.id::text));
  select max(attempt) into latest from public.som_work where user_id=w.user_id and assessment_id=a.id;
  if latest<>w.attempt then raise exception 'A newer revision already exists.';end if;
  insert into public.som_work(assessment_id,offering_id,user_id,attempt,answers,assessment_snapshot) values(a.id,w.offering_id,w.user_id,latest+1,w.answers,w.assessment_snapshot) returning public.som_work.id into rid;
 elsif action='unit_save_draft' then
  select * into u from public.som_units where public.som_units.id=payload->>'unit_id';
  if not found or not ministry_private.editor() then raise exception 'Curriculum editor access required.';end if;
  if u.kind='application' and not ministry_private.admin() then raise exception 'School administrator access required for admissions forms.';end if;
  d:=payload->'data';
  if jsonb_typeof(d)<>'object' or jsonb_typeof(d->'fields')<>'array' or jsonb_array_length(d->'fields')>150 then raise exception 'Choose a unit and valid workbook questions.';end if;
  for f in select value from jsonb_array_elements(d->'fields') loop
   if coalesce(f->>'id','')!~'^[a-zA-Z0-9_-]{1,80}$' or coalesce(length(trim(f->>'label')),0) not between 1 and 3000 or f->>'type' not in ('written','short','choice','check') then raise exception 'Each question needs a stable ID, label, and supported type.';end if;
  end loop;
  if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(d->'fields')) then raise exception 'Question IDs must be unique.';end if;
  insert into ministry_private.unit_drafts values(u.id,d,uid,now()) on conflict(unit_id) do update set data=excluded.data,actor=uid,updated_at=now();
  return jsonb_build_object('unit_id',u.id);
 elsif action='unit_publish' then
  select * into u from public.som_units where public.som_units.id=payload->>'unit_id' for update;
  if not found or not ministry_private.editor() then raise exception 'Curriculum editor access required.';end if;
  if u.kind='application' and not ministry_private.admin() then raise exception 'School administrator access required for admissions forms.';end if;
  select data into d from ministry_private.unit_drafts where unit_id=u.id;
  if d is null then raise exception 'Save and preview a draft before publishing.';end if;
  if u.state='review_required' and not coalesce((payload->>'reconciled')::boolean,false) then raise exception 'Confirm reconciliation against the controlling manual.';end if;
  if jsonb_array_length(d->'fields')=0 then raise exception 'Provide the actual assignment instructions and questions before release.';end if;
  insert into ministry_private.unit_content(unit_id,reading,instructions,fields) values(u.id,coalesce(d->>'reading',''),coalesce(d->>'instructions',''),d->'fields')
  on conflict(unit_id) do update set reading=excluded.reading,instructions=excluded.instructions,fields=excluded.fields;
  update public.som_units set title=coalesce(nullif(trim(d->>'title'),''),title),state='available',source_version=md5(d::text),notes='' where public.som_units.id=u.id;
  if u.assignment_id is not null then update public.som_content set published=true,title=coalesce(nullif(trim(d->>'title'),''),title),updated_at=now() where public.som_content.id=u.assignment_id;end if;
  delete from ministry_private.unit_drafts where unit_id=u.id;
  return jsonb_build_object('unit_id',u.id);
 elsif action='record_save' then
  student:=coalesce((payload->>'user_id')::uuid,uid);
  if not exists(select 1 from public.som_enrollments e where e.offering_id=o and e.user_id=student and e.status in ('pending','approved','completed')) then raise exception 'An enrollment request is required.';end if;
  if kind in ('application','orientation','concern','request') and student=uid then
   if state not in ('draft','submitted') then raise exception 'Invalid student record state.';end if;
  elsif kind in ('practicum','remediation','readiness') and ministry_private.manages(o) then null;
  elsif ministry_private.admin() then null;
  else raise exception 'You cannot change this school record.';end if;
  if kind in ('reference','admission_review','completion','certificate','case_note') and not ministry_private.admin() then raise exception 'School administrator access required.';end if;
  if payload->>'unit_id' is not null and not exists(select 1 from public.som_units where public.som_units.id=payload->>'unit_id' and offering_id=o) then raise exception 'Choose a unit in this school.';end if;
  if kind='practicum' and not exists(select 1 from public.som_units su where su.id=payload->>'unit_id' and su.state='available' and su.kind='practicum') then raise exception 'Practicum materials are still being prepared.';end if;
  perform pg_advisory_xact_lock(hashtext(student::text||o||kind));
  if kind in ('application','orientation') and payload->>'id' is null then
   select * into r from public.som_records sr where sr.offering_id=o and sr.user_id=student and sr.kind=course.kind for update;
  else select * into r from public.som_records where public.som_records.id=(payload->>'id')::uuid for update;end if;
  if r.id is not null and (r.offering_id<>o or r.user_id<>student or r.kind<>kind) then raise exception 'Record identity cannot change.';end if;
  if r.id is not null and student=uid and not ministry_private.admin() and r.status not in ('draft','revision_required') then raise exception 'This record has been submitted. Ask staff for a revision.';end if;
  d:=coalesce(payload->'data','{}');if jsonb_typeof(d)<>'object' or octet_length(d::text)>100000 then raise exception 'Invalid school record.';end if;
  if r.id is not null then d:=r.data||d;end if;
  if kind='orientation' and state='submitted' and not coalesce((d->>'acknowledged')::boolean,false) then raise exception 'Review and acknowledge the published program information.';end if;
  if kind='application' and state='submitted' and not exists(select 1 from jsonb_each_text(coalesce(d->'answers','{}')) where length(trim(value))>0) then raise exception 'Complete the application responses before submitting.';end if;
  if kind in ('application','concern','request') then
   select * into u from public.som_units where public.som_units.id=coalesce(payload->>'unit_id',o||'-application') and offering_id=o;
   if u.id is not null then
    if r.id is null then select jsonb_build_object('source_version',u.source_version,'fields',b.fields) into result from ministry_private.unit_content b where b.unit_id=u.id;
    else result:=r.data->'template';end if;
    d:=d||jsonb_build_object('template',result);
   end if;
  end if;
  if kind='certificate' then
   d:=d||jsonb_build_object('certificate_number',upper(trim(d->>'certificate_number')));
   if nullif(trim(d->>'certificate_number'),'') is null or not exists(select 1 from public.som_enrollments where offering_id=o and user_id=student and status='completed') then raise exception 'Confirm completion before issuing a numbered certificate.';end if;
  end if;
  if kind='completion' and state='complete' then
   if nullif(trim(d->>'review'),'') is null then raise exception 'Record the authorized completion review.';end if;
   perform public.ministry_command('enrollment',jsonb_build_object('id',(select e.id from public.som_enrollments e where e.offering_id=o and e.user_id=student),'status','completed'));
  end if;
  if r.id is null then
   insert into public.som_records(offering_id,user_id,kind,unit_id,status,data,created_by,updated_by) values(o,student,kind,payload->>'unit_id',state,d,uid,uid) returning public.som_records.id into rid;
  else
   update public.som_records set status=state,data=d,updated_by=uid,updated_at=now() where public.som_records.id=r.id;rid:=r.id;
  end if;
 else raise exception 'Unknown school action.';
 end if;
 insert into ministry_private.audit(actor,action,record_id,details) values(uid,action,rid::text,jsonb_build_object('kind',kind,'status',state));
 return jsonb_build_object('id',rid);
end $$;
revoke all on function public.ministry_course_command(text,jsonb) from public,anon;
grant execute on function public.ministry_course_command(text,jsonb) to authenticated;
notify pgrst,'reload schema';
