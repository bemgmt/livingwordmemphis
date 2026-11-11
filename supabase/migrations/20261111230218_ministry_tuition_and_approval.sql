-- $500 per semester. Payment confirmation gates initial approval only.
alter table public.som_enrollments add column first_approved_at timestamptz;
update public.som_enrollments set first_approved_at=created_at
where status in ('approved','completed','suspended');

create function ministry_private.approval_ready(enrollment_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.som_enrollments target
  join public.som_enrollments primary_enrollment
    on primary_enrollment.user_id=target.user_id
   and primary_enrollment.cohort_id=target.cohort_id
   and primary_enrollment.is_primary
   and primary_enrollment.status not in ('declined','withdrawn')
  join public.som_ledger l on l.enrollment_id=primary_enrollment.id and l.semester='spring'
  where target.id=enrollment_id
    and (target.is_primary or primary_enrollment.status in ('approved','completed'))
  group by primary_enrollment.id
  having count(*) filter(where l.kind='charge')>0 and sum(l.cents)<=0
 )
$$;
revoke all on function ministry_private.approval_ready(uuid) from public,anon,authenticated;

create function ministry_private.enrollment_tuition()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' and new.is_primary then
  insert into public.som_ledger(enrollment_id,semester,kind,cents,description)
  values(new.id,'spring','charge',50000,'Spring 2027 tuition · due January 9'),
        (new.id,'fall','charge',50000,'Fall 2027 tuition · due August 14')
  on conflict do nothing;
 end if;
 if new.status in ('approved','completed') and new.first_approved_at is null then
  if new.status='completed' then
   raise exception 'Approve enrollment after tuition is covered before confirming completion.';
  end if;
  -- Serialize approval with tuition corrections/payments on the primary account.
  perform 1 from public.som_enrollments
    where user_id=new.user_id and cohort_id=new.cohort_id and is_primary
    order by id for update;
  if not ministry_private.approval_ready(new.id) then
   raise exception 'Record the full $500 spring tuition payment or authorized waiver before approving this student.';
  end if;
  update public.som_enrollments set first_approved_at=now() where id=new.id;
 end if;
 return new;
end
$$;
revoke all on function ministry_private.enrollment_tuition() from public,anon,authenticated;
create trigger som_enrollment_tuition
after insert or update of status on public.som_enrollments
for each row execute function ministry_private.enrollment_tuition();

create function ministry_private.lock_tuition_account()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.som_enrollments where id=new.enrollment_id for update;
 if not exists(select 1 from public.som_enrollments where id=new.enrollment_id and is_primary) then
  raise exception 'Record tuition on the student''s primary enrollment.';
 end if;
 if new.kind in ('payment','waiver') and new.cents>=0 then
  raise exception 'Payments and waivers must reduce the tuition balance.';
 end if;
 return new;
end
$$;
revoke all on function ministry_private.lock_tuition_account() from public,anon,authenticated;
create trigger som_lock_tuition_account before insert on public.som_ledger
for each row execute function ministry_private.lock_tuition_account();

-- Retain every original charge/payment. Append the fee adjustment to its history.
insert into public.som_ledger(enrollment_id,semester,kind,cents,description)
select l.enrollment_id,l.semester,'correction',50000-l.cents,
       '2027 semester tuition updated to $500'
from public.som_ledger l join public.som_enrollments e on e.id=l.enrollment_id
where l.kind='charge' and l.cents<>50000 and e.cohort_id=2027 and e.is_primary;
insert into public.som_ledger(enrollment_id,semester,kind,cents,description)
select e.id,t.semester,'charge',50000,t.description
from public.som_enrollments e cross join (
 values ('spring','Spring 2027 tuition · due January 9'),
        ('fall','Fall 2027 tuition · due August 14')
) t(semester,description)
where e.cohort_id=2027 and e.is_primary and e.status in ('pending','approved','suspended','completed')
on conflict do nothing;

create function public.ministry_enrollment_summary()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not ministry_private.admin() then raise exception 'School administrator access required.';end if;
 select coalesce(jsonb_agg(row_data order by title),'[]'::jsonb) into result from (
  select f.title,jsonb_build_object(
   'id',f.id,'title',f.title,
   'pending',count(e.id) filter(where e.status='pending'),
   'ready',count(e.id) filter(where e.status='pending' and ministry_private.approval_ready(e.id)),
   'approved',count(e.id) filter(where e.status in ('approved','completed'))
  ) row_data from public.som_offerings f
  left join public.som_enrollments e on e.offering_id=f.id
  group by f.id,f.title
 ) schools;
 return result;
end
$$;
revoke all on function public.ministry_enrollment_summary() from public,anon;
grant execute on function public.ministry_enrollment_summary() to authenticated;
notify pgrst,'reload schema';
