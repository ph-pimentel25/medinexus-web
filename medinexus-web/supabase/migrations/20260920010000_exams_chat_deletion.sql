-- Migration: Módulo de Exames Laboratoriais, Chat Pós-Consulta (7 dias) e Exclusão de Conta (LGPD/Apple)
begin;

-- 1. TABELA DE EXAMES LABORATORIAIS (exam_orders)
create table if not exists public.exam_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  clinic_id uuid references public.clinics(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  title text not null,
  category text not null default 'laboratorial',
  instructions text,
  status text not null default 'solicitado' check (status in ('solicitado', 'agendado', 'em_andamento', 'concluido')),
  lab_name text,
  lab_partner_id text,
  result_url text,
  result_notes text,
  scheduled_for timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_orders_patient on public.exam_orders(patient_id);
create index if not exists idx_exam_orders_status on public.exam_orders(status);
create index if not exists idx_exam_orders_appointment on public.exam_orders(appointment_id);

alter table public.exam_orders enable row level security;

-- Políticas de RLS para exam_orders
drop policy if exists exam_orders_patient_select on public.exam_orders;
create policy exam_orders_patient_select on public.exam_orders
  for select to authenticated
  using (patient_id = auth.uid());

drop policy if exists exam_orders_doctor_select on public.exam_orders;
create policy exam_orders_doctor_select on public.exam_orders
  for select to authenticated
  using (
    exists (
      select 1 from public.clinic_members cm
      where cm.user_id = auth.uid()
        and (cm.doctor_id = exam_orders.doctor_id or cm.clinic_id = exam_orders.clinic_id)
    )
  );

drop policy if exists exam_orders_patient_insert on public.exam_orders;
create policy exam_orders_patient_insert on public.exam_orders
  for insert to authenticated
  with check (patient_id = auth.uid());

drop policy if exists exam_orders_patient_update on public.exam_orders;
create policy exam_orders_patient_update on public.exam_orders
  for update to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

grant select, insert, update on public.exam_orders to authenticated;


-- 2. TABELA DE CHAT PÓS-CONSULTA (post_consultation_messages)
create table if not exists public.post_consultation_messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  sender_role text not null check (sender_role in ('patient', 'doctor', 'system')),
  sender_name text not null,
  content text not null check (length(trim(content)) > 0 and length(content) <= 3000),
  created_at timestamptz not null default now()
);

create index if not exists idx_post_chat_appointment on public.post_consultation_messages(appointment_id);
create index if not exists idx_post_chat_created on public.post_consultation_messages(created_at);

alter table public.post_consultation_messages enable row level security;

-- Regra: Apenas paciente e médico da consulta podem ler mensagens
drop policy if exists post_chat_select on public.post_consultation_messages;
create policy post_chat_select on public.post_consultation_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = post_consultation_messages.appointment_id
        and (
          a.patient_id = auth.uid()
          or exists (
            select 1 from public.clinic_members cm
            where cm.user_id = auth.uid()
              and cm.doctor_id = a.doctor_id
          )
        )
    )
  );

-- Regra: Paciente e médico podem enviar mensagens APENAS se a consulta foi confirmada e tem até 7 dias
drop policy if exists post_chat_insert on public.post_consultation_messages;
create policy post_chat_insert on public.post_consultation_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.appointments a
      where a.id = post_consultation_messages.appointment_id
        and a.status = 'confirmed'
        and (
          a.patient_id = auth.uid()
          or exists (
            select 1 from public.clinic_members cm
            where cm.user_id = auth.uid()
              and cm.doctor_id = a.doctor_id
          )
        )
        -- Trava de 7 dias (604800 segundos) a partir do início da consulta
        and now() <= (coalesce(a.confirmed_start_at, a.requested_start_at, a.created_at) + interval '7 days')
    )
  );

grant select, insert on public.post_consultation_messages to authenticated;


-- 3. FUNÇÃO SEGURA PARA EXCLUSÃO/ANONIMIZAÇÃO DE CONTA (LGPD / Apple Guideline 5.1.1(v))
create or replace function public.anonymize_patient_account(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Apenas o próprio usuário autenticado ou superadmin pode solicitar
  if auth.uid() is distinct from p_user_id then
    raise exception 'Não autorizado para excluir esta conta';
  end if;

  -- 1. Remove preferências e notificações
  delete from public.patient_preferences where patient_id = p_user_id;
  delete from public.patient_search_preferences where patient_id = p_user_id;
  delete from public.notifications where recipient_id = p_user_id;

  -- 2. Limpa dados de contato direto do paciente preservando o ID para prontuários (Resolução CFM 1.821/2007)
  update public.patients
  set
    full_name = 'Conta Encerrada (LGPD)',
    cpf = null,
    phone = null,
    birth_date = null,
    address_zipcode = null,
    address_street = null,
    address_number = null,
    address_complement = null,
    address_neighborhood = null,
    address_city = null,
    address_state = null,
    notes = null,
    updated_at = now()
  where id = p_user_id;

  -- 3. Cancela consultas futuras pendentes
  update public.appointments
  set
    status = 'cancelled_by_patient',
    patient_cancellation_reason = 'Conta de acesso encerrada pelo titular.',
    patient_cancelled_at = now()
  where patient_id = p_user_id
    and status in ('pending', 'requested');

end $$;

revoke all on function public.anonymize_patient_account(uuid) from public;
grant execute on function public.anonymize_patient_account(uuid) to authenticated;

commit;
