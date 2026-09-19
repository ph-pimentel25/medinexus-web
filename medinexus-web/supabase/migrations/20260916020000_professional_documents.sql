-- Apply after the existing MediNexus schema. No backfill changes old documents.
begin;
create or replace function public.set_doctor_specialties(p_doctor_id uuid, p_specialty_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from doctors where id = p_doctor_id and user_id = auth.uid()) then
    raise exception 'Somente o médico pode alterar suas especialidades';
  end if;
  if cardinality(p_specialty_ids) < 1 or p_specialty_ids is null then raise exception 'Selecione uma especialidade'; end if;
  if exists(select 1 from unnest(p_specialty_ids) x where not exists(select 1 from specialties s where s.id=x)) then raise exception 'Especialidade inválida'; end if;
  perform 1 from doctors where id=p_doctor_id for update;
  delete from doctor_specialties where doctor_id=p_doctor_id;
  insert into doctor_specialties(doctor_id,specialty_id) select p_doctor_id,x from (select distinct unnest(p_specialty_ids) x) ids;
end $$;
revoke all on function public.set_doctor_specialties(uuid,uuid[]) from public;
grant execute on function public.set_doctor_specialties(uuid,uuid[]) to authenticated;

create table if not exists public.doctor_signatures (
  doctor_id uuid primary key references public.doctors(id),
  image_data text not null check (image_data like 'data:image/png;base64,%' and length(image_data) < 200000),
  authorized_at timestamptz not null default now(),
  authorized_by uuid not null references auth.users(id)
);
alter table public.doctor_signatures enable row level security;
create policy signature_owner_read on public.doctor_signatures for select to authenticated using (authorized_by=auth.uid());
create policy signature_owner_revoke on public.doctor_signatures for delete to authenticated using (authorized_by=auth.uid());
grant select, delete on public.doctor_signatures to authenticated;
create or replace function public.authorize_doctor_signature(p_doctor_id uuid, p_image text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from doctors where id=p_doctor_id and user_id=auth.uid()) then raise exception 'Médico não autorizado'; end if;
  insert into doctor_signatures(doctor_id,image_data,authorized_at,authorized_by) values(p_doctor_id,p_image,now(),auth.uid())
  on conflict(doctor_id) do update set image_data=excluded.image_data,authorized_at=now(),authorized_by=auth.uid();
end $$;
revoke all on function public.authorize_doctor_signature(uuid,text) from public;
grant execute on function public.authorize_doctor_signature(uuid,text) to authenticated;

alter table public.medical_documents add column if not exists signature_image text;
alter table public.medical_documents add column if not exists signature_authorized_at timestamptz;
alter table public.medical_documents add column if not exists certification_required boolean not null default false;
alter table public.medical_documents add column if not exists certificate_subject text;
alter table public.medical_documents add column if not exists certificate_issuer text;
alter table public.medical_documents add column if not exists certificate_serial text;
alter table public.medical_documents add column if not exists certificate_verified_at timestamptz;
alter table public.medical_documents add column if not exists identity_snapshot jsonb;

create or replace function public.guard_certified_document()
returns trigger language plpgsql security definer set search_path = public as $$
declare signature_row doctor_signatures; appt appointments; doc doctors;
begin
  if TG_OP='INSERT' then
    select * into doc from doctors where id=new.doctor_id;
    if auth.uid() is null or doc.user_id is distinct from auth.uid() then raise exception 'Emissão permitida somente ao médico responsável'; end if;
    select * into appt from appointments where id=new.appointment_id;
    if not found or appt.doctor_id is distinct from new.doctor_id or appt.patient_id is distinct from new.patient_id or appt.clinic_id is distinct from new.clinic_id then raise exception 'Documento não corresponde à consulta'; end if;
    select * into signature_row from doctor_signatures where doctor_id=new.doctor_id and authorized_by=auth.uid();
    new.signature_image := signature_row.image_data;
    new.signature_authorized_at := signature_row.authorized_at;
    new.certification_required := true;
    new.status := 'draft'; new.signature_status := 'pending';
    new.released_to_patient := false; new.released_at := null; new.issued_at := null;
    new.signed_at := null; new.signed_pdf_url := null; new.document_hash := null;
    new.certificate_subject := null; new.certificate_issuer := null; new.certificate_serial := null; new.certificate_verified_at := null;
    new.signature_provider := null; new.signature_validation_url := null;
    new.created_by := auth.uid();
    new.doctor_name := doc.name; new.doctor_crm := doc.crm; new.doctor_crm_state := doc.crm_state;
    new.identity_snapshot := jsonb_build_object(
      'patient', (select jsonb_build_object('full_name',full_name,'cpf',cpf,'birth_date',birth_date,'phone',phone,'health_plan_operator',health_plan_operator) from patients where id=new.patient_id),
      'doctor', jsonb_build_object('name',doc.name,'crm',doc.crm,'crm_state',doc.crm_state),
      'clinic', (select jsonb_build_object('trade_name',trade_name,'legal_name',legal_name,'address_street',address_street,'address_number',address_number,'address_complement',address_complement,'address_city',address_city,'address_state',address_state,'address_neighborhood',address_neighborhood) from clinics where id=new.clinic_id)
    );
  elsif old.certification_required then
    if auth.role() is distinct from 'service_role' then
      if not exists(select 1 from doctors where id=old.doctor_id and user_id=auth.uid()) then raise exception 'Médico não autorizado'; end if;
      if (to_jsonb(new) - 'status' - 'cancelled_at' - 'cancelled_reason' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'cancelled_at' - 'cancelled_reason' - 'updated_at')
        or new.status is distinct from old.status and new.status <> 'cancelled' then
        raise exception 'Documento preservado. Crie uma nova versão ou use o serviço de certificação';
      end if;
    end if;
    if new.status='cancelled' then new.released_to_patient := false; new.cancelled_at := coalesce(new.cancelled_at,now()); end if;
    if new.status='issued' and (new.signature_status is distinct from 'signed' or new.certificate_verified_at is null or new.signed_pdf_url is null or new.document_hash is null or new.certificate_serial is null) then raise exception 'Certificação ICP-Brasil ainda pendente'; end if;
    if new.released_to_patient and new.status <> 'issued' then raise exception 'Documento não certificado não pode ser liberado'; end if;
  end if;
  return new;
end $$;
alter table public.medical_documents enable row level security;
create policy certified_document_read on public.medical_documents for select to authenticated using (
 certification_required and (exists(select 1 from doctors where id=doctor_id and user_id=auth.uid()) or (patient_id=auth.uid() and released_to_patient and status='issued'))
);
create policy certified_document_read_guard on public.medical_documents as restrictive for select to authenticated using (
 not certification_required or exists(select 1 from doctors where id=doctor_id and user_id=auth.uid()) or (patient_id=auth.uid() and released_to_patient and status='issued')
);
create policy certified_document_anonymous_guard on public.medical_documents as restrictive for select to anon using(not certification_required);
create trigger enforce_certification before insert or update on public.medical_documents for each row execute function public.guard_certified_document();
commit;
