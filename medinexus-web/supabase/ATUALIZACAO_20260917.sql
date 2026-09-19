-- Atualização incremental de 17/09/2026: comissão DESATIVADA e documentos estruturados.
-- NÃO reaplica o pacote de 16/09. Executar uma vez, primeiro em homologação.
-- Não executar se estas duas migrations já tiverem sido aplicadas individualmente.
-- Transação única: qualquer erro desfaz todo este pacote.
begin;

-- 20260917010000_commercial_terms.sql
-- Additive: no existing appointment, document or payment is changed.
-- Commission is OFF. Only a future, explicit server-side administrative action
-- may activate it; a paid tier or a client request never activates collection.
create table public.platform_commercial_policy (
 singleton boolean primary key default true check(singleton),
 commission_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.platform_commercial_policy(singleton,commission_enabled) values(true,false);
alter table public.platform_commercial_policy enable row level security;
revoke all on public.platform_commercial_policy from anon,authenticated;
grant select,update on public.platform_commercial_policy to service_role;

create table public.professional_commercial_terms (
 id uuid primary key default gen_random_uuid(),
 doctor_id uuid references public.doctors(id),
 clinic_id uuid references public.clinics(id),
 tier text not null check(tier in ('free','professional','clinic_premium')),
 contracted_commission_bps integer,
 contract_reference text not null check(length(trim(contract_reference))>0),
 starts_at timestamptz not null default now(), ends_at timestamptz,
 created_at timestamptz not null default now(),
 check(num_nonnulls(doctor_id,clinic_id)=1),
 check(ends_at is null or ends_at>starts_at),
 check(contracted_commission_bps is null or (tier='clinic_premium' and contracted_commission_bps between 700 and 800))
);
alter table public.professional_commercial_terms enable row level security;
revoke all on public.professional_commercial_terms from anon,authenticated;
grant all on public.professional_commercial_terms to service_role;
-- No client mutation policy: selecting a paid plan in the UI cannot lower commission.

create table public.appointment_payment_quotes (
 id uuid primary key default gen_random_uuid(),
 appointment_id uuid not null unique references public.appointments(id),
 patient_id uuid not null references public.patients(id),
 doctor_id uuid not null references public.doctors(id),
 clinic_id uuid references public.clinics(id),
 terms_id uuid references public.professional_commercial_terms(id),
 tier text not null check(tier in ('free','professional','clinic_premium')),
 gross_cents integer not null check(gross_cents>0 and gross_cents<=100000000),
 commission_bps integer not null check(commission_bps=0 or commission_bps between 700 and 1500),
 commission_cents integer not null check(commission_cents>=0 and commission_cents<=gross_cents),
 currency text not null default 'BRL' check(currency='BRL'),
 payment_method text check(payment_method in ('cash','pix','card')),
 status text not null default 'quoted' check(status in ('quoted','cash_due','processing','pending','paid','refunded','disputed','unknown','cancelled')),
 provider text, provider_reference text unique, checkout_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.appointment_payment_quotes enable row level security;
revoke all on public.appointment_payment_quotes from anon,authenticated;
grant select on public.appointment_payment_quotes to authenticated;
grant all on public.appointment_payment_quotes to service_role;
create policy payment_quote_patient_read on public.appointment_payment_quotes for select to authenticated using(patient_id=auth.uid());
create policy payment_quote_doctor_read on public.appointment_payment_quotes for select to authenticated using(exists(select 1 from public.doctors d where d.id=doctor_id and d.user_id=auth.uid()));

create or replace function public.prepare_appointment_payment(p_appointment_id uuid,p_method text default null)
returns public.appointment_payment_quotes language plpgsql security definer set search_path=public as $$
declare a appointments; d doctors; terms professional_commercial_terms; q appointment_payment_quotes;
 amount integer; rate integer; selected_tier text;
begin
 if auth.uid() is null then raise exception 'Entre na sua conta'; end if;
 if p_method is not null and p_method<>'cash' then raise exception 'PIX e cartão exigem checkout autenticado do provedor'; end if;
 select * into a from appointments where id=p_appointment_id for update;
 if not found or a.patient_id is distinct from auth.uid() then raise exception 'Consulta não encontrada'; end if;
 if a.appointment_mode is distinct from 'private' or a.status is distinct from 'confirmed' then raise exception 'Pagamento disponível apenas para consulta particular confirmada'; end if;
 select * into q from appointment_payment_quotes where appointment_id=a.id;
 if found then
   if p_method='cash' and q.status='quoted' then
     update appointment_payment_quotes set payment_method='cash',status='cash_due',updated_at=now() where id=q.id returning * into q;
   elsif p_method='cash' and q.status<>'cash_due' then raise exception 'Já existe pagamento em andamento. Consulte o suporte antes de alterar a forma'; end if;
   return q;
 end if;
 select * into d from doctors where id=a.doctor_id;
 amount:=coalesce(d.private_price_cents,(select base_private_price_cents from clinics where id=a.clinic_id));
 if amount is null or amount<=0 or amount>100000000 then raise exception 'A clínica precisa informar o valor da consulta'; end if;
 select * into terms from professional_commercial_terms t
 where (t.clinic_id=a.clinic_id or t.doctor_id=a.doctor_id)
 and t.starts_at<=now() and (t.ends_at is null or t.ends_at>now())
 order by (t.clinic_id=a.clinic_id) desc nulls last,t.starts_at desc,t.created_at desc,t.id desc limit 1;
 selected_tier:=coalesce(terms.tier,'free');
 rate:=case selected_tier when 'professional' then 1000 when 'clinic_premium' then coalesce(terms.contracted_commission_bps,800) else 1500 end;
 if not coalesce((select commission_enabled from platform_commercial_policy where singleton),false) then rate:=0; end if;
 insert into appointment_payment_quotes(appointment_id,patient_id,doctor_id,clinic_id,terms_id,tier,gross_cents,commission_bps,commission_cents,payment_method,status)
 values(a.id,a.patient_id,a.doctor_id,a.clinic_id,terms.id,selected_tier,amount,rate,round(amount::numeric*rate/10000)::integer,p_method,case when p_method='cash' then 'cash_due' else 'quoted' end)
 returning * into q;
 return q;
end $$;
revoke all on function public.prepare_appointment_payment(uuid,text) from public;
grant execute on function public.prepare_appointment_payment(uuid,text) to authenticated;

-- 20260917020000_document_content.sql
-- Validate new records only; never rewrite an existing/signed medical document.
create or replace function public.validate_new_document_content()
returns trigger language plpgsql set search_path=public as $$
declare item jsonb; medications jsonb; rendered text:='';
begin
 if new.document_type<>'medical_certificate' then
   if new.days_off is not null or exists(
     select 1 from jsonb_path_query(coalesce(new.content,'{}'::jsonb),'$.** ? (@.type() == "object").keyvalue()') entry
     where entry->>'key' in ('days_off','rest_days','leave_days','medical_leave_days','rest_period','leave_period')
       and entry->'value'<>'null'::jsonb and entry->>'value'<>''
   ) then raise exception 'Dias e períodos de afastamento pertencem exclusivamente ao atestado médico'; end if;
 end if;
 if new.document_type='prescription' then
   medications:=case when new.content ? 'medications' then new.content->'medications' else jsonb_build_array(new.content) end;
   if jsonb_typeof(medications) is distinct from 'array' then raise exception 'Lista de medicamentos inválida'; end if;
   if jsonb_array_length(medications)<1 or jsonb_array_length(medications)>50 then raise exception 'Informe de 1 a 50 medicamentos'; end if;
   for item in select value from jsonb_array_elements(medications) loop
     if jsonb_typeof(item) is distinct from 'object' or length(trim(coalesce(item->>'medication_name','')))<2 or length(trim(coalesce(item->>'medication_use','')))<2 then
       raise exception 'Informe o nome do medicamento e a posologia';
     end if;
     rendered:=concat_ws(E'\n\n',nullif(rendered,''),concat_ws(E'\n',trim(item->>'medication_name'),
       'Posologia: '||trim(item->>'medication_use'),
       case when nullif(trim(item->>'dosage'),'') is not null then 'Dosagem: '||trim(item->>'dosage') end,
       case when nullif(trim(item->>'route'),'') is not null then 'Via: '||trim(item->>'route') end,
       case when nullif(trim(item->>'duration'),'') is not null then 'Duração: '||trim(item->>'duration') end,
       case when nullif(trim(item->>'quantity'),'') is not null then 'Quantidade: '||trim(item->>'quantity') end));
   end loop;
   new.plain_text:=concat_ws(E'\n\n',rendered,case when nullif(trim(new.content->>'notes'),'') is not null then 'Orientações: '||trim(new.content->>'notes') end);
   new.purpose:=null;
 end if;
 return new;
end $$;
create trigger validate_document_content before insert on public.medical_documents for each row execute function public.validate_new_document_content();

commit;
