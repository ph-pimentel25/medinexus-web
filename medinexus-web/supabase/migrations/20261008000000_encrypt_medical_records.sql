-- Habilita a extensão pgcrypto para cifragem simétrica nativa no banco
create extension if not exists pgcrypto;

-- Adiciona a coluna binária que guardará os dados criptografados
alter table public.consultation_notes add column if not exists private_notes_encrypted bytea;

-- Cria a função de trigger que intercepta o INSERT/UPDATE
create or replace function public.encrypt_consultation_notes()
returns trigger as $$
begin
  -- Em produção real, a chave não deve ficar hardcoded, mas vir de um cofre (Vault) 
  -- ou do current_setting('app.settings.encryption_key'). 
  -- Para fins de conformidade LGPD da nossa release, usaremos uma chave de ambiente.
  
  if NEW.private_notes is not null then
    NEW.private_notes_encrypted = pgp_sym_encrypt(
      NEW.private_notes, 
      coalesce(current_setting('app.settings.encryption_key', true), 'fallback-dev-key-change-in-prod')
    );
    -- Removemos a versão em texto plano para não ficar exposta no banco
    NEW.private_notes = null;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- Aplica o trigger à tabela
drop trigger if if exists trg_encrypt_consultation_notes on public.consultation_notes;
create trigger trg_encrypt_consultation_notes
before insert or update on public.consultation_notes
for each row
execute function public.encrypt_consultation_notes();

-- Atualiza a função de leitura para descriptografar os dados em tempo de execução
create or replace function public.read_own_consultation_note(p_appointment_id uuid) 
returns jsonb 
language sql stable security definer set search_path=public as $$
  select jsonb_build_object(
    'id', n.id,
    'appointment_id', n.appointment_id,
    'patient_id', n.patient_id,
    'doctor_id', n.doctor_id,
    'private_notes', case 
        when n.private_notes_encrypted is not null then pgp_sym_decrypt(
            n.private_notes_encrypted, 
            coalesce(current_setting('app.settings.encryption_key', true), 'fallback-dev-key-change-in-prod')
        )
        else n.private_notes 
    end,
    'clinical_summary', n.clinical_summary,
    'created_at', n.created_at
  )
  from consultation_notes n 
  join doctors d on d.id=n.doctor_id 
  where n.appointment_id=p_appointment_id and d.user_id=auth.uid() 
  limit 1;
$$;
