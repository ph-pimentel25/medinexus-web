# Segurança das migrations MediNexus

## Aplicação confirmada em 30/09/2026

A migration `20260919010000_account_stabilization.sql` foi aplicada ao projeto `xutxgnbbhtnxzijmsdfv` (MediNexus Data Base), após autorização de Pedro. Não reaplicar nesse projeto. Os pacotes anteriores não foram executados novamente e o histórico não foi marcado indiscriminadamente como aplicado.

Antes da aplicação, foram conferidos os pré-requisitos e os triggers reais. Um ensaio transacional com `ROLLBACK` passou; a aplicação definitiva repetiu as verificações antes do `COMMIT`. Impressões digitais dos registros comprovaram preservação dos dados anteriores, desconsiderando apenas o novo status e o `updated_at` dos profissionais. Conferência posterior: quatro contas com quatro travas, nove triggers esperados, sem permissão de escrita do cliente nas travas nem execução da função interna.

SHA-256 do arquivo aplicado: `979AEA26BEB43EE81780D24B99D0DECA40803419396BE3FDAF3937DAA8978B45`.

A cópia preventiva local foi limitada a IDs, timestamps, `is_active`, contagens e definições afetadas, em `medinexus-web/artifacts/release-20260930/`, ignorado pelo Git e pelo deploy. Não é um backup completo nem comprova restauração de desastre. A API não retornou backups disponíveis; o backup amplo foi rejeitado pela revisão automática por envolver dados clínicos e de autenticação além do escopo. Nenhum objeto do Storage foi alterado. Backup integral e restauração continuam pendentes no roadmap operacional.

As instruções abaixo ficam como referência para outros ambientes. Apenas um projeto remoto foi identificado; o ensaio foi feito com rollback no esquema real, além dos testes locais, e não em um segundo projeto de homologação.

## Histórico remoto antes de `supabase db push`

Os pacotes SQL de 16/09, 17/09 e 18/09 podem ter sido executados manualmente pelo SQL Editor. Isso cria os objetos, mas não necessariamente registra cada arquivo em `supabase_migrations.schema_migrations`. **Não rode `supabase db push` assumindo que o histórico local corresponde ao remoto.**

Antes de qualquer push:

1. Confirme o projeto e ambiente corretos. Prepare backup do banco e dos objetos do Storage; são operações distintas.
2. Compare a lista local de `medinexus-web/supabase/migrations/` com o histórico remoto. Se a tabela de histórico existir, consulte `select * from supabase_migrations.schema_migrations order by version;`. A ausência da tabela não prova ausência de mudanças manuais.
3. Consulte tabelas, colunas, funções, políticas e triggers efetivos. `VERIFICAR_ATUALIZACOES.sql` é uma conferência parcial de presença, não de equivalência ou de versão.
4. Registre quais pacotes foram executados pelo SQL Editor e quais migrations individuais eles contêm. Compare os corpos das funções e políticas, não apenas os nomes.
5. Se o histórico divergir, pare o push e planeje a reconciliação. Só use `migration repair` após comprovar quais versões foram realmente aplicadas. Não marque versões indiscriminadamente como aplicadas.
6. Teste em homologação. Não use `db reset`, `DROP`, exclusão de dados ou reparo destrutivo para contornar “already exists”.

As migrations antigas e seus pacotes agregados foram preservados nesta sprint. Não execute um pacote e depois seus arquivos individuais no mesmo banco.

## Nova migration de estabilização

Arquivo: [`20260919010000_account_stabilization.sql`](../medinexus-web/supabase/migrations/20260919010000_account_stabilization.sql).

- Deve ser aplicada **uma vez**, após os pacotes de 17/09 e 18/09, primeiro em homologação.
- Adiciona `verification_status` a `doctors` e `clinics`. Os existentes recebem `verified` por compatibilidade com o MVP; isso não comprova consulta a CRM, Receita Federal ou análise documental. Novos registros começam como `pending`, mesmo se o cliente tentar enviar outro status.
- Cria `account_registration_locks`, com leitura apenas do próprio usuário e sem escrita de clientes. Captura o tipo original no cadastro Auth e protege alterações de `profiles`, `patients`, `doctors`, `clinics` e `clinic_members`.
- Preserva a precedência legada médico → clínica → paciente para relacionamentos já existentes. Não remove nem transforma relacionamentos históricos; conflitos preexistentes precisam de revisão administrativa.
- Reutiliza `clinics.cnpj`. Novos registros e mudanças desse campo exigem 14 dígitos e verificadores corretos. Valores antigos inválidos/nulos não são regravados nem impedem salvar outros campos.
- Não altera `is_active`, comissões, pagamentos ou políticas de integração.

### Passos manuais no Supabase

1. Abra o SQL Editor no ambiente de homologação.
2. Antes de aplicar, examine os triggers existentes de `auth.users`, `profiles` e `patients`:

```sql
select n.nspname as schema_name, c.relname as table_name,
       t.tgname, pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal
  and ((n.nspname='auth' and c.relname='users')
       or (n.nspname='public' and c.relname in ('profiles','patients')));
```

O fluxo admite o perfil padrão `patient` criado pelo Auth antes da conclusão profissional. Um trigger legado que também crie indiscriminadamente uma linha em `patients` para profissionais precisa ser revisado em homologação; não o apague automaticamente.

3. Confira se a nova estrutura já existe:

```sql
select to_regclass('public.account_registration_locks') as registration_locks,
       to_regprocedure('public.guard_registration_type()') as role_guard,
       to_regprocedure('public.guard_professional_verification()') as verification_guard;
```

Se já existir total ou parcialmente, compare o que foi aplicado antes de continuar. Não repita o arquivo às cegas.

4. Cole e execute o arquivo completo, incluindo `begin` e `commit`. O retorno esperado é `Success. No rows returned`. Se ocorrer erro, a transação deve ser revertida; investigue a mensagem sem remover objetos.
5. Valide os status com `select verification_status,count(*) from public.doctors group by 1;` e a consulta equivalente para `clinics`.
6. Teste com usuários fictícios distintos: paciente não cria médico/clínica, profissional não muda seu papel nem sua verificação, cadastro confirmado por e-mail conclui apenas o tipo original, clínica nova exige CNPJ e clínica antiga continua editável.
7. Depois da homologação, aplique a mesma migration no projeto de produção e publique o código correspondente. **A migration não foi executada remotamente nesta sprint.**

Mudanças de verificação ficam restritas à administração via SQL Editor/servidor confiável; não há aprovação automática nem painel novo de administração. Registre a evidência e o responsável pela verificação antes de alterar um status real.

## Auth e recuperação

No Supabase Authentication, confira Site URL e a lista de redirects para `/login` e `/recuperar-conta?update=1` no domínio real e em homologação. Configure mínimo de senha **8** também no painel Auth para fazer a regra valer na API; isso não redefine senhas existentes. Não alteramos essa configuração remota automaticamente.

A tela aceita troca de senha após o evento `PASSWORD_RECOVERY` validado pelo SDK, não pela existência de sessão ou parâmetro de URL. Veja [documentação oficial de recuperação](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) e [eventos de autenticação](https://supabase.com/docs/reference/javascript/auth-onauthstatechange). A autorização local é temporária, em memória e vinculada à sessão; recarregar a página depois de consumir o link pode exigir solicitar outro. SMTP/entrega real continuam precisando de homologação.
