begin;
alter table public.patient_preferences add column if not exists clinical_ai_consent boolean not null default false;
create table public.clinical_history_grants(
 patient_id uuid not null references patients(id),doctor_id uuid not null references doctors(id),
 expires_at timestamptz not null,created_at timestamptz not null default now(),primary key(patient_id,doctor_id)
);
alter table public.clinical_history_grants enable row level security;
grant select,insert,update,delete on public.clinical_history_grants to authenticated;
create policy patient_controls_history on public.clinical_history_grants for all to authenticated using(patient_id=auth.uid()) with check(patient_id=auth.uid() and expires_at>now() and expires_at<=now()+interval '90 days' and exists(select 1 from appointments a where a.patient_id=auth.uid() and a.doctor_id=clinical_history_grants.doctor_id));
create or replace function public.has_clinical_history_access(p_patient uuid) returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and (p_patient=auth.uid() or exists(select 1 from clinical_history_grants g join doctors d on d.id=g.doctor_id where g.patient_id=p_patient and g.expires_at>now() and d.user_id=auth.uid() and d.is_active=true));
$$;
revoke all on function public.has_clinical_history_access(uuid) from public;
grant execute on function public.has_clinical_history_access(uuid) to authenticated;
-- Restrict legacy broad read policies as well. A treating doctor keeps access to
-- their own note; access to other professionals' notes needs a patient grant.
alter table public.consultation_notes enable row level security;
create policy clinical_note_read_guard on public.consultation_notes as restrictive for select to authenticated using(public.has_clinical_history_access(patient_id) or exists(select 1 from doctors d where d.id=doctor_id and d.user_id=auth.uid()));

-- A shared row does not expose the physician's private_notes column.
revoke select on public.consultation_notes from public,anon,authenticated;
revoke select(private_notes) on public.consultation_notes from public,anon,authenticated;
do $$declare columns_list text;begin
 select string_agg(quote_ident(attname),',') into columns_list from pg_attribute where attrelid='public.consultation_notes'::regclass and attnum>0 and not attisdropped and attname<>'private_notes';
 execute 'grant select('||columns_list||') on public.consultation_notes to authenticated';
end $$;
create or replace function public.read_own_consultation_note(p_appointment_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select to_jsonb(n) from consultation_notes n join doctors d on d.id=n.doctor_id where n.appointment_id=p_appointment_id and d.user_id=auth.uid() limit 1;
$$;
revoke all on function public.read_own_consultation_note(uuid) from public;
grant execute on function public.read_own_consultation_note(uuid) to authenticated;
create policy clinical_note_insert_guard on public.consultation_notes as restrictive for insert to authenticated with check(exists(select 1 from appointments a join doctors d on d.id=a.doctor_id where a.id=appointment_id and a.patient_id=consultation_notes.patient_id and a.doctor_id=consultation_notes.doctor_id and a.status='confirmed' and d.user_id=auth.uid()));
create policy clinical_note_update_guard on public.consultation_notes as restrictive for update to authenticated using(exists(select 1 from appointments a join doctors d on d.id=a.doctor_id where a.id=appointment_id and a.patient_id=consultation_notes.patient_id and a.doctor_id=consultation_notes.doctor_id and a.status='confirmed' and d.user_id=auth.uid())) with check(exists(select 1 from appointments a join doctors d on d.id=a.doctor_id where a.id=appointment_id and a.patient_id=consultation_notes.patient_id and a.doctor_id=consultation_notes.doctor_id and a.status='confirmed' and d.user_id=auth.uid()));
create policy clinical_note_delete_guard on public.consultation_notes as restrictive for delete to authenticated using(false);

-- Shared base history must not bypass the explicit patient grant.
alter table public.medical_records enable row level security;
create policy medical_record_shared_read on public.medical_records for select to authenticated using(public.has_clinical_history_access(patient_id));
create policy medical_record_read_guard on public.medical_records as restrictive for select to authenticated using(public.has_clinical_history_access(patient_id));
create policy medical_record_update_guard on public.medical_records as restrictive for update to authenticated using(public.has_clinical_history_access(patient_id)) with check(public.has_clinical_history_access(patient_id));
create policy medical_record_insert_guard on public.medical_records as restrictive for insert to authenticated with check(public.has_clinical_history_access(patient_id));
-- Legacy prescriptions remain original records, never proof of certification.
alter table public.prescriptions enable row level security;
create policy prescription_read_guard on public.prescriptions as restrictive for select to authenticated using(public.has_clinical_history_access(patient_id) or exists(select 1 from doctors d where d.id=doctor_id and d.user_id=auth.uid()));
drop policy certified_document_read_guard on public.medical_documents;
create policy certified_document_read_guard on public.medical_documents as restrictive for select to authenticated using(
 not certification_required or exists(select 1 from doctors d where d.id=doctor_id and d.user_id=auth.uid()) or (public.has_clinical_history_access(patient_id) and released_to_patient and status='issued')
);
create policy shared_document_read on public.medical_documents for select to authenticated using(public.has_clinical_history_access(patient_id) and released_to_patient and status='issued');

create table public.clinical_summary_jobs(
 appointment_id uuid primary key references appointments(id),status text not null default 'queued' check(status in ('queued','processing','done','failed')),
 source_revision integer not null default 0,attempts integer not null default 0,updated_at timestamptz not null default now()
);
alter table public.clinical_summary_jobs enable row level security;
revoke all on public.clinical_summary_jobs from anon,authenticated;
grant all on public.clinical_summary_jobs to service_role;
create table public.clinical_ai_summaries(
 id uuid primary key default gen_random_uuid(),appointment_id uuid not null references appointments(id),patient_id uuid not null references patients(id),doctor_id uuid not null references doctors(id),
 source_revision integer not null default 0,summary text not null check(length(summary) between 1 and 12000),source_hash text not null,model text not null,
 created_at timestamptz not null default now(),reviewed_at timestamptz,reviewed_by uuid references auth.users(id),
 unique(appointment_id,source_hash)
);
alter table public.clinical_ai_summaries enable row level security;
revoke all on public.clinical_ai_summaries from anon,authenticated;
grant select on public.clinical_ai_summaries to authenticated;
grant all on public.clinical_ai_summaries to service_role;
create policy clinical_ai_read on public.clinical_ai_summaries for select to authenticated using((reviewed_at is not null and public.has_clinical_history_access(patient_id)) or exists(select 1 from doctors d where d.id=doctor_id and d.user_id=auth.uid()));
create or replace function public.enqueue_clinical_summary() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='completed' and old.status is distinct from new.status then
 insert into clinical_summary_jobs(appointment_id) values(new.id) on conflict do nothing;
 end if;return new;
end $$;
create trigger enqueue_clinical_summary after update of status on appointments for each row execute function public.enqueue_clinical_summary();
-- New documents/notes after completion request a new summary version.
create or replace function public.refresh_clinical_summary_source() returns trigger language plpgsql security definer set search_path=public as $$
declare appt_id uuid;
begin
 appt_id:=case when TG_OP='DELETE' then old.appointment_id else new.appointment_id end;
 if exists(select 1 from appointments where id=appt_id and status='completed') then
  insert into clinical_summary_jobs(appointment_id) values(appt_id) on conflict(appointment_id) do update set
   source_revision=clinical_summary_jobs.source_revision+1,attempts=0,
   status=case when clinical_summary_jobs.status='processing' then 'processing' else 'queued' end,updated_at=now();
 end if;
 if TG_OP='DELETE' then return old;end if;return new;
end $$;
create trigger refresh_summary_notes after insert or update or delete on consultation_notes for each row execute function public.refresh_clinical_summary_source();
create trigger refresh_summary_documents after insert or update or delete on medical_documents for each row execute function public.refresh_clinical_summary_source();
create trigger refresh_summary_legacy after insert or update or delete on prescriptions for each row execute function public.refresh_clinical_summary_source();
create or replace function public.claim_clinical_summary_job() returns setof clinical_summary_jobs language sql security definer set search_path=public as $$
 update clinical_summary_jobs set status='processing',attempts=attempts+1,updated_at=now() where appointment_id in (
 select j.appointment_id from clinical_summary_jobs j join appointments a on a.id=j.appointment_id join patient_preferences p on p.patient_id=a.patient_id
 where j.status='queued' and j.attempts<3 and a.status='completed' and p.clinical_ai_consent=true order by j.updated_at for update of j skip locked limit 1
 ) returning *;
$$;
revoke all on function public.claim_clinical_summary_job() from public;
grant execute on function public.claim_clinical_summary_job() to service_role;
create or replace function public.review_clinical_summary(p_summary_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 update clinical_ai_summaries s set reviewed_at=now(),reviewed_by=auth.uid() where s.id=p_summary_id and s.reviewed_at is null
 and exists(select 1 from clinical_summary_jobs j where j.appointment_id=s.appointment_id and j.source_revision=s.source_revision)
 and exists(select 1 from doctors d where d.id=s.doctor_id and d.user_id=auth.uid() and d.is_active=true);
 if not found then raise exception 'Resumo não disponível para revisão por este médico'; end if;
end $$;
revoke all on function public.review_clinical_summary(uuid) from public;
grant execute on function public.review_clinical_summary(uuid) to authenticated;

create table public.clinical_history_access_log(id uuid primary key default gen_random_uuid(),patient_id uuid references patients(id),actor_id uuid references auth.users(id),created_at timestamptz not null default now());
alter table public.clinical_history_access_log enable row level security;
revoke all on public.clinical_history_access_log from anon,authenticated;
grant all on public.clinical_history_access_log to service_role;
create or replace function public.read_authorized_clinical_history(p_patient_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
 if not public.has_clinical_history_access(p_patient_id) then raise exception 'O paciente precisa autorizar o acesso ao histórico'; end if;
 insert into clinical_history_access_log(patient_id,actor_id) values(p_patient_id,auth.uid());
 select coalesce(jsonb_agg(item order by happened_at desc),'[]'::jsonb) into result from (
 select coalesce(a.confirmed_start_at,a.created_at) as happened_at,jsonb_build_object('id',a.id,'date',coalesce(a.confirmed_start_at,a.created_at),'doctor_name',d.name,
 'ai_summaries',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'summary',s.summary,'created_at',s.created_at,'reviewed_at',s.reviewed_at) order by s.created_at desc),'[]'::jsonb) from clinical_ai_summaries s where s.appointment_id=a.id and s.reviewed_at is not null),
 'notes',(select coalesce(jsonb_agg(jsonb_build_object('subjective',n.subjective,'objective',n.objective,'assessment',n.assessment,'plan',n.plan,'summary',n.summary)),'[]'::jsonb) from consultation_notes n where n.appointment_id=a.id),
 'legacy_prescriptions',(select coalesce(jsonb_agg(jsonb_build_object('title',p.title,'content',p.content,'guidance',p.guidance)),'[]'::jsonb) from prescriptions p where p.appointment_id=a.id),
 'documents',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'type',m.document_type,'text',m.plain_text,'issued_at',m.issued_at)),'[]'::jsonb) from medical_documents m where m.appointment_id=a.id and m.status='issued' and m.released_to_patient=true)) as item
 from appointments a join doctors d on d.id=a.doctor_id where a.patient_id=p_patient_id and a.status='completed' order by happened_at desc limit 100
 ) entries;return result;
end $$;
revoke all on function public.read_authorized_clinical_history(uuid) from public;
grant execute on function public.read_authorized_clinical_history(uuid) to authenticated;
commit;
