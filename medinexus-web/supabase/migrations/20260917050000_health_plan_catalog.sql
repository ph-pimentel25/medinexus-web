begin;
alter table public.health_plans add column if not exists catalog_key text;
alter table public.health_plans add column if not exists source_url text;
alter table public.health_plans add column if not exists catalog_scope text;
create unique index if not exists health_plans_catalog_key on public.health_plans(catalog_key) where catalog_key is not null;
-- Reference catalog, not a statement of eligibility, coverage or current sale.
-- Never merge variants, legacy IDs or regional Unimed cooperatives by name.
insert into health_plans(name,operator_name,plan_type,catalog_key,source_url,catalog_scope) values
('Prestige Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469529131','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469529131; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Executivo Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469530135','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469530135; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Especial 100 Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469531133','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469531133; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Clássico Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469532131','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469532131; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Exato Empresarial/PME AHO QP COP','SulAmérica Saúde','Saúde','sulamerica-469535136','https://www.sulamerica.com.br/saude/Proposta_Saude_PMEMais.pdf','ANS 469535136; ambulatorial/hospitalar, apartamento com coparticipação. Referência documental histórica; confira a carteirinha e contrato'),
('Ouro Pro Copar Q','Porto Saúde','Saúde','porto-ouro-pro-copar-q','https://www.portoseguro.com.br/porto%20seguro-saude/','Categoria conforme identificação na carteirinha'),
('Prata Pro Copar E','Porto Saúde','Saúde','porto-prata-pro-copar-e','https://www.portoseguro.com.br/porto%20seguro-saude/','Categoria conforme identificação na carteirinha'),
('Diamante Pro Copar Q','Porto Saúde','Saúde','porto-diamante-pro-copar-q','https://www.portoseguro.com.br/porto%20seguro-saude/','Categoria conforme identificação na carteirinha'),
('Amil S380 MG','Amil','Saúde','amil-s380-mg','https://galeria.amil.com.br/corretor/materiais/80550_281202023083537_manual_de_vendas_amil_pme_-_dezembro_2023_%28v57%29.pdf','Variante MG; referência documental 2023, não equivale a outras regiões'),
('Amil S450 MG','Amil','Saúde','amil-s450-mg','https://galeria.amil.com.br/corretor/materiais/80550_281202023083537_manual_de_vendas_amil_pme_-_dezembro_2023_%28v57%29.pdf','Variante MG; referência documental 2023, não equivale a outras regiões'),
('Top Nacional Q CE A','Bradesco Saúde','Saúde','bradesco-top-nacional-q-ce-a-443100036','https://www3.bradescoseguros.com.br/upload/br/saude/443100036_Plano_Top_FE_Nac_Quarto_sem_copart_versao_a3.pdf','Variante do regulamento 443100036; não equivale a outros planos Top'),
('Nosso Plano','Hapvida','Saúde','hapvida-nosso-plano','https://www2.hapvida.com.br/planos-de-saude-individuais','Categoria; conferir região, acomodação e contrato'),
('Nosso Médico','Hapvida','Saúde','hapvida-nosso-medico','https://www2.hapvida.com.br/planos-de-saude-individuais','Categoria; conferir região e contrato'),
('Mix','Hapvida','Saúde','hapvida-mix','https://www2.hapvida.com.br/planos-de-saude-individuais','Categoria; conferir região, acomodação e contrato'),
('Pleno','Hapvida','Saúde','hapvida-pleno','https://www2.hapvida.com.br/planos-de-saude-individuais','Categoria; conferir região, acomodação e contrato')
on conflict(catalog_key) where catalog_key is not null do nothing;

create or replace function public.normalize_patient_catalog_plan() returns trigger language plpgsql set search_path=public as $$
declare plan health_plans;
begin
 if new.default_health_plan_id is not null then
  select * into plan from health_plans where id=new.default_health_plan_id;
  if not found then raise exception 'Plano cadastrado inválido'; end if;
  new.health_plan_operator:=coalesce(plan.operator_name,new.health_plan_operator);
  new.health_plan_product_name:=plan.name;
 end if;
 return new;
end $$;
create trigger normalize_patient_plan before insert or update of default_health_plan_id,health_plan_operator,health_plan_product_name on public.patients for each row execute function public.normalize_patient_catalog_plan();
commit;
