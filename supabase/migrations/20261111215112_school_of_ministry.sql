-- School of Ministry: all writes go through an authenticated, audited command.
-- No service credential is needed by the application. Never apply to production as a test.
create schema if not exists ministry_private;
revoke all on schema ministry_private from public;
grant usage on schema ministry_private to authenticated;
create table public.som_cohorts(id integer primary key, title text not null, timezone text not null default 'America/Chicago');
create table public.som_offerings(id text primary key, cohort_id integer not null references public.som_cohorts, school text not null, title text not null);
create table public.som_meetings(id text primary key, cohort_id integer not null references public.som_cohorts, day date not null, semester text not null check(semester in ('spring','fall')), kind text not null check(kind in ('instruction','exam','break','orientation')), week integer, chapters integer[] not null default '{}');
create table public.som_instructors(offering_id text references public.som_offerings, user_id uuid references auth.users, primary key(offering_id,user_id));
create table public.som_enrollments(id uuid primary key default gen_random_uuid(),cohort_id integer not null references public.som_cohorts,offering_id text not null references public.som_offerings,user_id uuid not null references auth.users,is_primary boolean not null default true,status text not null default 'pending' check(status in ('pending','approved','declined','suspended','withdrawn','completed')),created_at timestamptz not null default now(),unique(offering_id,user_id));
create unique index som_one_primary on public.som_enrollments(user_id,cohort_id) where is_primary and status in ('pending','approved','suspended','completed');
-- Private drafts are separate rows from published lessons; no draft payload can leak through SELECT.
create table public.som_content(id uuid primary key default gen_random_uuid(),offering_id text not null references public.som_offerings,kind text not null check(kind in ('lesson','draft','assignment','exam','announcement')),title text not null check(length(title) between 1 and 180),data jsonb not null default '{}',published boolean not null default false,updated_at timestamptz not null default now());
create unique index som_one_final_per_semester on public.som_content(offering_id,(data->>'semester')) where kind='exam';
create table ministry_private.answer_keys(assessment_id uuid primary key references public.som_content on delete cascade,answers jsonb not null default '{}');
create table public.som_work(id uuid primary key default gen_random_uuid(),assessment_id uuid not null references public.som_content,offering_id text not null references public.som_offerings,user_id uuid not null references auth.users,attempt integer not null default 1,status text not null default 'draft' check(status in ('draft','submitted')),response text not null default '',answers jsonb not null default '{}',saved_at timestamptz not null default now(),submitted_at timestamptz,late boolean not null default false,unique(assessment_id,user_id,attempt));
create table public.som_grades(work_id uuid primary key references public.som_work,score numeric not null check(score>=0),feedback text not null default '',released boolean not null default false,updated_at timestamptz not null default now());
create table public.som_attendance(offering_id text references public.som_offerings,meeting_id text references public.som_meetings,user_id uuid references auth.users,status text not null check(status in ('present','late','absent','excused')),primary key(offering_id,meeting_id,user_id));
create table public.som_progress(offering_id text references public.som_offerings,user_id uuid references auth.users,chapter integer check(chapter between 1 and 45),primary key(offering_id,user_id,chapter));
create table public.som_recommendations(offering_id text references public.som_offerings,user_id uuid references auth.users,instructor_id uuid not null references auth.users,recommendation text not null,updated_at timestamptz not null default now(),primary key(offering_id,user_id));
create table public.som_ledger(id uuid primary key default gen_random_uuid(),enrollment_id uuid not null references public.som_enrollments,semester text not null check(semester in ('spring','fall')),kind text not null check(kind in ('charge','payment','waiver','correction')),cents integer not null,description text not null,created_at timestamptz not null default now());
create unique index som_semester_charge on public.som_ledger(enrollment_id,semester) where kind='charge';
create table public.som_resources(id uuid primary key default gen_random_uuid(),offering_id text not null references public.som_offerings,owner_id uuid not null references auth.users,content_id uuid references public.som_content,work_id uuid references public.som_work,bucket text not null check(bucket in ('ministry-curriculum','ministry-submissions')),path text unique not null,filename text not null,mime text not null,size bigint not null check(size between 1 and 52428800),ready boolean not null default false,check((content_id is null)<>(work_id is null)));
create table ministry_private.audit(id bigint generated always as identity primary key,actor uuid not null,action text not null,record_id text,details jsonb not null,created_at timestamptz not null default now());

create function ministry_private.signed_in() returns boolean language sql stable as $$ select auth.uid() is not null and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false) $$;
create function ministry_private.admin() returns boolean language sql stable security definer set search_path='' as $$ select ministry_private.signed_in() and exists(select 1 from public.user_roles where user_id=auth.uid() and role::text in ('executive','apostle')) $$;
create function ministry_private.editor() returns boolean language sql stable security definer set search_path='' as $$ select ministry_private.signed_in() and exists(select 1 from public.user_roles where user_id=auth.uid() and role::text in ('staff','executive','apostle')) $$;
create function ministry_private.teaches(o text) returns boolean language sql stable security definer set search_path='' as $$ select ministry_private.signed_in() and exists(select 1 from public.som_instructors where offering_id=o and user_id=auth.uid()) $$;
create function ministry_private.manages(o text) returns boolean language sql stable as $$ select ministry_private.admin() or ministry_private.teaches(o) $$;
create function ministry_private.enrolled(o text, writable boolean default false) returns boolean language sql stable security definer set search_path='' as $$ select ministry_private.signed_in() and exists(select 1 from public.som_enrollments where offering_id=o and user_id=auth.uid() and (status='approved' or (not writable and status='completed'))) $$;
create function ministry_private.read_content(c uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.som_content i where i.id=c and (ministry_private.manages(i.offering_id) or (ministry_private.editor() and i.kind in ('draft','lesson')) or (i.kind<>'draft' and i.published and ministry_private.enrolled(i.offering_id) and (i.kind<>'exam' or (i.data->>'opens_at')::timestamptz<=now())))) $$;
create function ministry_private.read_work(w uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.som_work where id=w and (ministry_private.manages(offering_id) or (user_id=auth.uid() and ministry_private.enrolled(offering_id)))) $$;
create function ministry_private.read_resource(r uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.som_resources where id=r and (ministry_private.admin() or (content_id is not null and ministry_private.read_content(content_id) and (ready or owner_id=auth.uid())) or (work_id is not null and ministry_private.read_work(work_id) and (ready or owner_id=auth.uid())))) $$;
revoke all on all functions in schema ministry_private from public;
grant execute on all functions in schema ministry_private to authenticated;

do $$ declare t text; begin foreach t in array array['som_cohorts','som_offerings','som_meetings','som_instructors','som_enrollments','som_content','som_work','som_grades','som_attendance','som_progress','som_ledger','som_resources','som_recommendations'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon, authenticated',t);execute format('grant select on public.%I to authenticated',t);end loop; end $$;
create policy som_recommendations_read on public.som_recommendations for select to authenticated using(ministry_private.manages(offering_id));
create policy som_catalog on public.som_cohorts for select to authenticated using(ministry_private.signed_in());
create policy som_catalog on public.som_offerings for select to authenticated using(ministry_private.signed_in());
create policy som_calendar on public.som_meetings for select to authenticated using(ministry_private.signed_in());
create policy som_instructors_read on public.som_instructors for select to authenticated using(ministry_private.manages(offering_id) or ministry_private.enrolled(offering_id) or ministry_private.editor());
create policy som_enrollment_read on public.som_enrollments for select to authenticated using(ministry_private.signed_in() and (user_id=auth.uid() or ministry_private.manages(offering_id)));
create policy som_content_read on public.som_content for select to authenticated using(ministry_private.read_content(id));
create policy som_work_read on public.som_work for select to authenticated using(ministry_private.read_work(id));
create policy som_grades_read on public.som_grades for select to authenticated using(ministry_private.read_work(work_id) and (released or exists(select 1 from public.som_work w where w.id=work_id and ministry_private.manages(w.offering_id))));
create policy som_attendance_read on public.som_attendance for select to authenticated using(ministry_private.manages(offering_id) or (user_id=auth.uid() and ministry_private.enrolled(offering_id)));
create policy som_progress_read on public.som_progress for select to authenticated using(ministry_private.manages(offering_id) or (user_id=auth.uid() and ministry_private.enrolled(offering_id)));
create policy som_ledger_read on public.som_ledger for select to authenticated using(ministry_private.admin() or exists(select 1 from public.som_enrollments e where e.id=enrollment_id and e.user_id=auth.uid()));
create policy som_resource_read on public.som_resources for select to authenticated using(ministry_private.read_resource(id));

-- Answer keys and audit entries have no client grants, including instructors.
alter table ministry_private.answer_keys enable row level security;
alter table ministry_private.audit enable row level security;

create function ministry_private.finish_work(w uuid, at_time timestamptz default now()) returns void language plpgsql security definer set search_path='' as $$
declare a public.som_content; s public.som_work; q jsonb; points numeric:=0; total numeric:=0; keys jsonb; has_written boolean:=false;
begin
 select * into s from public.som_work where id=w for update;
 if s.status='submitted' then return;end if;
 select * into a from public.som_content where id=s.assessment_id;
 update public.som_work set status='submitted',submitted_at=at_time,late=(a.kind='assignment' and (a.data->>'due_at')::timestamptz<at_time) where id=w;
 if a.kind='exam' then
  select answers into keys from ministry_private.answer_keys where assessment_id=a.id;
  for q in select value from jsonb_array_elements(coalesce(a.data->'questions','[]')) loop
   total:=total+(q->>'points')::numeric;
   if q->>'type'='written' then has_written:=true;
   elsif s.answers->>(q->>'id')=keys->>(q->>'id') then points:=points+(q->>'points')::numeric;end if;
  end loop;
  insert into public.som_grades(work_id,score,feedback,released) values(w,points,case when has_written then 'Written responses await instructor grading.' else 'Multiple-choice scoring complete.' end,false) on conflict(work_id) do nothing;
 end if;
end $$;
revoke all on function ministry_private.finish_work(uuid,timestamptz) from public,authenticated;

create function public.ministry_command(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); o text:=payload->>'offering_id'; rid uuid; item public.som_content; work public.som_work; enrollment public.som_enrollments; result jsonb:='{}'; q jsonb; n numeric; clean jsonb; keydata jsonb; latest integer;
begin
 if not ministry_private.signed_in() then raise exception 'Sign in with a church account.';end if;
 if octet_length(payload::text)>250000 then raise exception 'Request is too large.';end if;
 if action='request_enrollment' or action='grant_enrollment' then
  if action='grant_enrollment' and not ministry_private.admin() then raise exception 'School administrator access required.';end if;
  if not exists(select 1 from public.som_offerings where id=o) then raise exception 'Choose a school.';end if;
  if action='request_enrollment' and coalesce(payload->>'accepted','false')<>'true' then raise exception 'Review the program expectations.';end if;
  insert into public.som_enrollments(cohort_id,offering_id,user_id,is_primary,status) select f.cohort_id,f.id,case when action='grant_enrollment' then (payload->>'user_id')::uuid else uid end,action='request_enrollment' or not exists(select 1 from public.som_enrollments e where e.user_id=(payload->>'user_id')::uuid and e.cohort_id=f.cohort_id and e.is_primary and e.status in ('pending','approved','suspended','completed')),case when action='grant_enrollment' then 'approved' else 'pending' end from public.som_offerings f where f.id=o returning id into rid;
 elsif action='enrollment' then
  if not ministry_private.admin() then raise exception 'School administrator access required.';end if;
  select * into enrollment from public.som_enrollments where id=(payload->>'id')::uuid for update;
  if not found then raise exception 'Enrollment not found.';end if;
  update public.som_enrollments set status=payload->>'status' where id=enrollment.id;
  rid:=enrollment.id;
 elsif action='instructor' then
  if not ministry_private.admin() then raise exception 'School administrator access required.';end if;
  if coalesce((payload->>'remove')::boolean,false) then delete from public.som_instructors where offering_id=o and user_id=(payload->>'user_id')::uuid;
  else insert into public.som_instructors values(o,(payload->>'user_id')::uuid) on conflict do nothing;end if;
 elsif action='save_content' then
  if payload->>'kind' in ('draft','lesson') then
   if not ministry_private.editor() then raise exception 'Curriculum editor access required.';end if;
  elsif not ministry_private.manages(o) then raise exception 'Assigned instructor access required.';end if;
  if payload->>'kind'='lesson' then raise exception 'Publish a curriculum draft instead.';end if;
  clean:=coalesce(payload->'data','{}');
  if payload->>'kind' in ('exam','assignment') then
   if not coalesce(clean->>'max_points','') ~ '^[0-9]+(\.[0-9]+)?$' or (clean->>'max_points')::numeric<=0 then raise exception 'Points possible must be positive.';end if;
   if coalesce(clean->>'semester','') not in ('spring','fall') then raise exception 'Choose a semester.';end if;
   if payload->>'kind'='exam' then
    if coalesce(clean->>'mode','') not in ('online','in-person') then raise exception 'Choose exam delivery mode.';end if;
    if clean->>'mode'='online' then
     if (clean->>'opens_at')::timestamptz is null or (clean->>'closes_at')::timestamptz is null or (clean->>'closes_at')::timestamptz <= (clean->>'opens_at')::timestamptz then raise exception 'Choose a valid examination window.';end if;
     keydata:=coalesce(clean->'answer_key','{}');clean:=clean-'answer_key';n:=0;
     if jsonb_array_length(coalesce(clean->'questions','[]'))=0 then raise exception 'Add examination questions.';end if;
     for q in select value from jsonb_array_elements(clean->'questions') loop
      if coalesce(q->>'type','') not in ('multiple-choice','written') or length(coalesce(q->>'prompt',''))=0 or q->>'points' is null or (q->>'points')::numeric<=0 or length(coalesce(q->>'id',''))=0 or q ? 'answer' or q ? 'correct' then raise exception 'Invalid question.';end if;
      if q->>'type'='multiple-choice' and (jsonb_array_length(coalesce(q->'options','[]'))<2 or not (q->'options' ? (keydata->>(q->>'id')))) then raise exception 'Choose a valid answer for each multiple-choice question.';end if;
      n:=n+(q->>'points')::numeric;
     end loop;
     if n<>(clean->>'max_points')::numeric then raise exception 'Question points must equal the examination total.';end if;
    end if;
   end if;
  end if;
  rid:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
  select * into item from public.som_content where id=rid for update;
  if found and (item.offering_id<>o or item.kind<>payload->>'kind') then raise exception 'Content cannot be moved between schools or types.';end if;
  if payload->>'kind'='draft' then
   clean:=clean-'published_id';
   if item.data ? 'published_id' then clean:=clean||jsonb_build_object('published_id',item.data->>'published_id');end if;
  end if;
  if exists(select 1 from public.som_work where assessment_id=rid) then raise exception 'Assessment has attempts; its questions and scoring are locked.';end if;
  insert into public.som_content(id,offering_id,kind,title,data,published) values(rid,o,payload->>'kind',trim(payload->>'title'),clean,coalesce((payload->>'published')::boolean,false)) on conflict(id) do update set title=excluded.title,data=excluded.data,published=excluded.published,updated_at=now();
  if keydata is not null then insert into ministry_private.answer_keys values(rid,keydata) on conflict(assessment_id) do update set answers=excluded.answers;end if;
 elsif action='publish_lesson' then
  if not ministry_private.editor() then raise exception 'Curriculum editor access required.';end if;
  select * into item from public.som_content where id=(payload->>'id')::uuid and kind='draft' for update;
  if not found then raise exception 'Draft not found.';end if;
  rid:=coalesce((item.data->>'published_id')::uuid,gen_random_uuid());
  insert into public.som_content(id,offering_id,kind,title,data,published) values(rid,item.offering_id,'lesson',item.title,item.data-'published_id',true) on conflict(id) do update set title=excluded.title,data=excluded.data,published=true,updated_at=now();
  update public.som_content set data=data||jsonb_build_object('published_id',rid) where id=item.id;
  -- Only the current draft attachment set appears on the published revision.
  delete from public.som_resources where content_id=rid;
  insert into public.som_resources(offering_id,owner_id,content_id,bucket,path,filename,mime,size,ready)
   select offering_id,owner_id,rid,bucket,path||'#ref-'||rid::text,filename,mime,size,true from public.som_resources r where r.content_id=item.id and ready and not exists(select 1 from public.som_resources x where x.content_id=rid and x.path=r.path||'#ref-'||rid::text);
 elsif action in ('save_work','submit_work','start_work') then
  select * into item from public.som_content where id=(payload->>'assessment_id')::uuid and kind in ('assignment','exam');
  if not found or not item.published or not ministry_private.enrolled(item.offering_id,true) then raise exception 'An active enrollment and released assessment are required.';end if;
  perform pg_advisory_xact_lock(hashtext(uid::text||item.id::text));
  select * into work from public.som_work where assessment_id=item.id and user_id=uid order by attempt desc limit 1 for update;
  if item.kind='exam' then
   if item.data->>'mode'<>'online' then raise exception 'This examination is completed in person.';end if;
   if now()<(item.data->>'opens_at')::timestamptz then raise exception 'This examination has not opened.';end if;
   if now()>=(item.data->>'closes_at')::timestamptz then
    if work.id is not null then perform ministry_private.finish_work(work.id,(item.data->>'closes_at')::timestamptz);end if;
    return jsonb_build_object('closed',true,'id',work.id);
   end if;
  end if;
  if work.id is null then insert into public.som_work(assessment_id,offering_id,user_id) values(item.id,item.offering_id,uid) returning * into work;end if;
  if work.status='submitted' then
   if action='submit_work' then return jsonb_build_object('id',work.id);end if;
   raise exception 'This attempt is submitted and read-only.';
  end if;
  if action<>'start_work' then
   update public.som_work set response=coalesce(payload->>'response',''),answers=coalesce(payload->'answers','{}'),saved_at=now() where id=work.id;
  end if;
  if action='submit_work' then perform ministry_private.finish_work(work.id);end if;
  rid:=work.id;
 elsif action='retake' then
  select * into work from public.som_work where id=(payload->>'id')::uuid for update;
  select * into item from public.som_content where id=work.assessment_id;
  if not ministry_private.manages(work.offering_id) or item.kind<>'exam' or work.status<>'submitted' then raise exception 'An instructor must authorize a retake of a submitted exam.';end if;
  perform pg_advisory_xact_lock(hashtext(work.user_id::text||item.id::text));
  select max(attempt) into latest from public.som_work where assessment_id=item.id and user_id=work.user_id;
  if latest<>work.attempt then raise exception 'A newer attempt already exists.';end if;
  insert into public.som_work(assessment_id,offering_id,user_id,attempt) values(item.id,work.offering_id,work.user_id,latest+1) returning id into rid;
 elsif action='exam_window' then
  select * into item from public.som_content where id=(payload->>'id')::uuid and kind='exam' for update;
  if not found or not ministry_private.manages(item.offering_id) then raise exception 'Assigned instructor access required.';end if;
  if (payload->>'closes_at')::timestamptz is null or (payload->>'opens_at')::timestamptz is null or (payload->>'closes_at')::timestamptz<=(payload->>'opens_at')::timestamptz then raise exception 'Choose a valid exam window.';end if;
  update public.som_content set data=data||jsonb_build_object('opens_at',payload->>'opens_at','closes_at',payload->>'closes_at') where id=item.id;rid:=item.id;
 elsif action='mark_missing' then
  select * into item from public.som_content where id=(payload->>'assessment_id')::uuid and kind='assignment';
  if not found or not ministry_private.manages(item.offering_id) then raise exception 'Assigned instructor access required.';end if;
  if not exists(select 1 from public.som_enrollments where offering_id=item.offering_id and user_id=(payload->>'user_id')::uuid and status='approved') then raise exception 'Student not enrolled.';end if;
  insert into public.som_work(assessment_id,offering_id,user_id,status,submitted_at,late) values(item.id,item.offering_id,(payload->>'user_id')::uuid,'submitted',now(),true) on conflict(assessment_id,user_id,attempt) do update set status='submitted',submitted_at=coalesce(som_work.submitted_at,now()),late=true returning id into rid;
  insert into public.som_grades values(rid,0,'Missing work recorded by instructor.',coalesce((payload->>'released')::boolean,false),now()) on conflict(work_id) do update set score=0,feedback=excluded.feedback,released=excluded.released,updated_at=now();
 elsif action='grade' then
  select * into work from public.som_work where id=(payload->>'id')::uuid for update;
  select * into item from public.som_content where id=work.assessment_id;
  n:=(payload->>'score')::numeric;
  if not ministry_private.manages(work.offering_id) or work.status<>'submitted' then raise exception 'Assigned instructor access required for submitted work.';end if;
  if n is null or n<0 or n>(item.data->>'max_points')::numeric then raise exception 'Score must be within the points possible.';end if;
  insert into public.som_grades(work_id,score,feedback,released) values(work.id,n,coalesce(payload->>'feedback',''),coalesce((payload->>'released')::boolean,false)) on conflict(work_id) do update set score=excluded.score,feedback=excluded.feedback,released=excluded.released,updated_at=now();rid:=work.id;
 elsif action='in_person_score' then
  select * into item from public.som_content where id=(payload->>'assessment_id')::uuid;
  if not ministry_private.manages(item.offering_id) or item.kind<>'exam' or item.data->>'mode'<>'in-person' then raise exception 'An assigned instructor and in-person examination are required.';end if;
  if not exists(select 1 from public.som_enrollments where offering_id=item.offering_id and user_id=(payload->>'user_id')::uuid and status in ('approved','completed')) then raise exception 'Student not enrolled.';end if;
  n:=(payload->>'score')::numeric;
  if n is null or n<0 or n>(item.data->>'max_points')::numeric then raise exception 'Invalid score.';end if;
  insert into public.som_work(assessment_id,offering_id,user_id,status,submitted_at) values(item.id,item.offering_id,(payload->>'user_id')::uuid,'submitted',now()) on conflict(assessment_id,user_id,attempt) do update set status='submitted' returning id into rid;
  insert into public.som_grades values(rid,n,coalesce(payload->>'feedback',''),coalesce((payload->>'released')::boolean,false),now()) on conflict(work_id) do update set score=excluded.score,feedback=excluded.feedback,released=excluded.released,updated_at=now();
 elsif action='attendance' then
  if not ministry_private.manages(o) then raise exception 'Assigned instructor access required.';end if;
  if not exists(select 1 from public.som_meetings m join public.som_offerings f on f.cohort_id=m.cohort_id where f.id=o and m.id=payload->>'meeting_id' and m.kind in ('instruction','exam')) then raise exception 'Attendance is only recorded at teaching and examination meetings.';end if;
  if not exists(select 1 from public.som_enrollments where offering_id=o and user_id=(payload->>'user_id')::uuid and status in ('approved','completed')) then raise exception 'Student not enrolled.';end if;
  insert into public.som_attendance values(o,payload->>'meeting_id',(payload->>'user_id')::uuid,payload->>'status') on conflict(offering_id,meeting_id,user_id) do update set status=excluded.status;
 elsif action='recommend_completion' then
  if not ministry_private.manages(o) then raise exception 'Assigned instructor access required.';end if;
  if not exists(select 1 from public.som_enrollments where offering_id=o and user_id=(payload->>'user_id')::uuid and status in ('approved','completed')) then raise exception 'Student not enrolled.';end if;
  insert into public.som_recommendations values(o,(payload->>'user_id')::uuid,uid,payload->>'recommendation',now()) on conflict(offering_id,user_id) do update set instructor_id=excluded.instructor_id,recommendation=excluded.recommendation,updated_at=now();
 elsif action='progress' then
  if not ministry_private.enrolled(o,true) then raise exception 'An active enrollment is required.';end if;
  if coalesce((payload->>'done')::boolean,false) then insert into public.som_progress values(o,uid,(payload->>'chapter')::integer) on conflict do nothing;
  else delete from public.som_progress where offering_id=o and user_id=uid and chapter=(payload->>'chapter')::integer;end if;
 elsif action='tuition' then
  if not ministry_private.admin() then raise exception 'School administrator access required.';end if;
  if payload->>'kind'='charge' then raise exception 'Semester charges are created with enrollment.';end if;
  insert into public.som_ledger(enrollment_id,semester,kind,cents,description) values((payload->>'enrollment_id')::uuid,payload->>'semester',payload->>'kind',(payload->>'cents')::integer,coalesce(nullif(trim(payload->>'description'),''),'Recorded tuition entry')) returning id into rid;
  if (payload->>'kind' in ('payment','waiver') and (payload->>'cents')::integer>=0) then raise exception 'Payments and waivers must reduce the balance.';end if;
 elsif action='prepare_upload' then
  if payload->>'bucket'='ministry-curriculum' then
   select * into item from public.som_content where id=(payload->>'content_id')::uuid and kind='draft';
   if not found or not ministry_private.editor() then raise exception 'Choose a curriculum draft as an editor.';end if;o:=item.offering_id;
  elsif payload->>'bucket'='ministry-submissions' then
   select * into work from public.som_work where id=(payload->>'work_id')::uuid;
   if not found or work.user_id<>uid or work.status<>'draft' or not ministry_private.enrolled(work.offering_id,true) then raise exception 'Choose your writable assignment draft.';end if;
   select * into item from public.som_content where id=work.assessment_id;
   if item.kind<>'assignment' then raise exception 'Examination file attachments are not supported.';end if;o:=work.offering_id;
  else raise exception 'Invalid upload destination.';end if;
  rid:=gen_random_uuid();
  insert into public.som_resources(id,offering_id,owner_id,content_id,work_id,bucket,path,filename,mime,size) values(rid,o,uid,case when payload->>'bucket'='ministry-curriculum' then item.id end,case when payload->>'bucket'='ministry-submissions' then work.id end,payload->>'bucket',o||'/'||uid::text||'/'||rid::text,payload->>'filename',payload->>'mime',(payload->>'size')::bigint);
  select to_jsonb(r) into result from public.som_resources r where id=rid;
 elsif action='finish_upload' then
  -- Called only after the route verifies size and content type in Storage; DB verifies them too.
  if not exists(select 1 from public.som_resources r join storage.objects s on s.bucket_id=r.bucket and s.name=r.path where r.id=(payload->>'id')::uuid and r.owner_id=uid and (s.metadata->>'size')::bigint=r.size and s.metadata->>'mimetype'=r.mime and ((r.content_id is not null and ministry_private.editor()) or exists(select 1 from public.som_work w where w.id=r.work_id and w.user_id=uid and w.status='draft' and ministry_private.enrolled(w.offering_id,true)))) then raise exception 'Uploaded file could not be verified, or the draft is no longer writable.';end if;
  update public.som_resources set ready=true where id=(payload->>'id')::uuid;rid:=(payload->>'id')::uuid;
 else raise exception 'Unknown school action.';
 end if;
 if action in ('enrollment','grant_enrollment') then
  insert into public.som_ledger(enrollment_id,semester,kind,cents,description) select id,'spring','charge',35000,'Spring 2027 tuition · due January 9' from public.som_enrollments where id=rid and is_primary and status in ('approved','completed') on conflict do nothing;
  insert into public.som_ledger(enrollment_id,semester,kind,cents,description) select id,'fall','charge',32500,'Fall 2027 tuition · due August 14' from public.som_enrollments where id=rid and is_primary and status in ('approved','completed') on conflict do nothing;
 end if;
 insert into ministry_private.audit(actor,action,record_id,details) values(uid,action,coalesce(rid::text,o),payload-'answers'-'response'-'data');
 return result||jsonb_build_object('id',rid);
end $$;
revoke all on function public.ministry_command(text,jsonb) from public,anon;
grant execute on function public.ministry_command(text,jsonb) to authenticated;

-- Deadline finalization is an idempotent reconciliation. Call on reads and via a scheduled job.
create function public.ministry_finalize_exams() returns integer language plpgsql security definer set search_path='' as $$
declare w record;n integer:=0;begin
 if not ministry_private.signed_in() and coalesce(auth.jwt()->>'role','')<>'service_role' then return 0;end if;
 for w in select s.id,(a.data->>'closes_at')::timestamptz closes_at from public.som_work s join public.som_content a on a.id=s.assessment_id where s.status='draft' and a.kind='exam' and (a.data->>'closes_at')::timestamptz<=now() and (coalesce(auth.jwt()->>'role','')='service_role' or ministry_private.manages(s.offering_id) or s.user_id=auth.uid()) loop perform ministry_private.finish_work(w.id,w.closes_at);n:=n+1;end loop;return n;
end $$;
revoke all on function public.ministry_finalize_exams() from public,anon;
grant execute on function public.ministry_finalize_exams() to authenticated;
grant execute on function public.ministry_finalize_exams() to service_role;

create function public.ministry_identity() returns jsonb language sql stable as $$ select jsonb_build_object('admin',ministry_private.admin(),'editor',ministry_private.editor()) $$;
revoke all on function public.ministry_identity() from public,anon;
grant execute on function public.ministry_identity() to authenticated;
create function public.ministry_roster() returns table(id uuid,display_name text) language sql stable security definer set search_path='' as $$ select distinct p.id,p.display_name from public.profiles p where ministry_private.signed_in() and (ministry_private.admin() or p.id=auth.uid() or exists(select 1 from public.som_enrollments e where e.user_id=p.id and ministry_private.manages(e.offering_id)) or exists(select 1 from public.som_instructors i where i.user_id=p.id and ministry_private.enrolled(i.offering_id))) $$;
revoke all on function public.ministry_roster() from public,anon;
grant execute on function public.ministry_roster() to authenticated;

create function public.ministry_exam_key(assessment uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare o text;result jsonb;begin
 select offering_id into o from public.som_content where id=assessment and kind='exam';
 if not found or not ministry_private.manages(o) then raise exception 'Assigned instructor access required.';end if;
 select answers into result from ministry_private.answer_keys where assessment_id=assessment;
 return coalesce(result,'{}');end $$;
revoke all on function public.ministry_exam_key(uuid) from public,anon;
grant execute on function public.ministry_exam_key(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) select b,b,false,52428800,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','video/mp4'] from unnest(array['ministry-curriculum','ministry-submissions']) b;
create policy som_storage_insert on storage.objects for insert to authenticated with check(exists(select 1 from public.som_resources r where r.path=name and r.bucket=bucket_id and r.owner_id=auth.uid() and not r.ready and ministry_private.signed_in()));
create policy som_storage_read on storage.objects for select to authenticated using(exists(select 1 from public.som_resources r where split_part(r.path,'#ref-',1)=name and r.bucket=bucket_id and ministry_private.read_resource(r.id)));

insert into public.som_cohorts values(2027,'2027 School of Ministry','America/Chicago');
insert into public.som_offerings values('2027-apostles',2027,'apostles','School of the Apostles'),('2027-prophets',2027,'prophets','School of the Prophets'),('2027-evangelist',2027,'evangelist','School of the Evangelist'),('2027-pastor',2027,'pastor','School of the Pastor'),('2027-teacher',2027,'teacher','School of the Teacher');
-- Calendar rows are appended by the checked-in seed generator using program.ts.

insert into public.som_meetings values
('2027-01-12',2027,'2027-01-12','spring','orientation',null,ARRAY[]::integer[]),
('2027-01-19',2027,'2027-01-19','spring','instruction',1,ARRAY[1,2]::integer[]),
('2027-01-26',2027,'2027-01-26','spring','instruction',2,ARRAY[3,4]::integer[]),
('2027-02-02',2027,'2027-02-02','spring','instruction',3,ARRAY[5]::integer[]),
('2027-02-09',2027,'2027-02-09','spring','instruction',4,ARRAY[6,7]::integer[]),
('2027-02-16',2027,'2027-02-16','spring','instruction',5,ARRAY[8,9]::integer[]),
('2027-02-23',2027,'2027-02-23','spring','instruction',6,ARRAY[10,11]::integer[]),
('2027-03-02',2027,'2027-03-02','spring','instruction',7,ARRAY[12]::integer[]),
('2027-03-09',2027,'2027-03-09','spring','break',null,ARRAY[]::integer[]),
('2027-03-16',2027,'2027-03-16','spring','instruction',8,ARRAY[13,14]::integer[]),
('2027-03-23',2027,'2027-03-23','spring','instruction',9,ARRAY[15,16]::integer[]),
('2027-03-30',2027,'2027-03-30','spring','instruction',10,ARRAY[17]::integer[]),
('2027-04-06',2027,'2027-04-06','spring','instruction',11,ARRAY[18,19]::integer[]),
('2027-04-13',2027,'2027-04-13','spring','instruction',12,ARRAY[20]::integer[]),
('2027-04-20',2027,'2027-04-20','spring','instruction',13,ARRAY[21,22]::integer[]),
('2027-04-27',2027,'2027-04-27','spring','instruction',14,ARRAY[23]::integer[]),
('2027-05-04',2027,'2027-05-04','spring','exam',null,ARRAY[]::integer[]),
('2027-08-24',2027,'2027-08-24','fall','instruction',1,ARRAY[24,25]::integer[]),
('2027-08-31',2027,'2027-08-31','fall','instruction',2,ARRAY[26,27]::integer[]),
('2027-09-07',2027,'2027-09-07','fall','instruction',3,ARRAY[28]::integer[]),
('2027-09-14',2027,'2027-09-14','fall','instruction',4,ARRAY[29,30]::integer[]),
('2027-09-21',2027,'2027-09-21','fall','instruction',5,ARRAY[31,32]::integer[]),
('2027-09-28',2027,'2027-09-28','fall','instruction',6,ARRAY[33]::integer[]),
('2027-10-05',2027,'2027-10-05','fall','instruction',7,ARRAY[34,35]::integer[]),
('2027-10-12',2027,'2027-10-12','fall','break',null,ARRAY[]::integer[]),
('2027-10-19',2027,'2027-10-19','fall','instruction',8,ARRAY[36,37]::integer[]),
('2027-10-26',2027,'2027-10-26','fall','instruction',9,ARRAY[38]::integer[]),
('2027-11-02',2027,'2027-11-02','fall','instruction',10,ARRAY[39,40]::integer[]),
('2027-11-09',2027,'2027-11-09','fall','instruction',11,ARRAY[41]::integer[]),
('2027-11-16',2027,'2027-11-16','fall','instruction',12,ARRAY[42,43]::integer[]),
('2027-11-23',2027,'2027-11-23','fall','break',null,ARRAY[]::integer[]),
('2027-11-30',2027,'2027-11-30','fall','instruction',13,ARRAY[44,45]::integer[]),
('2027-12-07',2027,'2027-12-07','fall','exam',null,ARRAY[]::integer[]);

-- The Prophets alignment is supplied; the other schools intentionally have no invented chapter mapping.
insert into public.som_content(offering_id,kind,title,data)
select o.id,'draft','Week '||m.week||' · '||m.day::text,
 jsonb_build_object('meeting_id',m.id,'chapters',case when o.school='prophets' then to_jsonb(m.chapters) else '[]'::jsonb end,'body','Curriculum being prepared','study','Recommended independent study: 3–4 hours this teaching week.')
from public.som_offerings o join public.som_meetings m on m.cohort_id=o.cohort_id where m.kind='instruction';
notify pgrst, 'reload schema';
