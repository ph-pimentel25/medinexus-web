# MediNexus — relatório da sprint de estabilização

## Entrega e limite de publicação

O Git estava limpo em `04f5a69` antes das alterações. A sprint trabalhou sobre o aplicativo existente, sem substituir arquitetura, framework, Supabase, interface ou modelo comercial. **Alterações locais; nova migration ainda não aplicada no Supabase, sem commit/push/deploy desta sprint.** O deploy atual continua sendo a versão anterior.

## Alterações

1. **Tipo de conta:** cadastro concluído exibe acesso à conta existente; cadastro incompleto só oferece o tipo original. `completeRegistration` rejeita outro tipo antes de qualquer escrita. Resolução web/mobile consulta o registro imutável de tipo e não promove paciente por metadata editável. O banco também impede novos vínculos incompatíveis e alterações indevidas de papel.
2. **Verificação:** `doctors` e `clinics` recebem os quatro status `pending`, `verified`, `rejected`, `suspended`. Backfill `verified` preserva os antigos por decisão do MVP; novos registros recebem `pending`. Médico/clínica vê aviso na área autenticada. Usuários comuns não podem atribuir o próprio status. `is_active` continua independente.
3. **CNPJ:** obrigatório no cadastro de clínica, máscara na interface, verificadores de 14 dígitos no cliente e banco; normalização sem pontuação na mesma coluna `clinics.cnpj`. Configurações permitem corrigir o campo. Valores legados não são regravados automaticamente nem impedem editar outros campos.
4. **Recuperação:** rota pública sem sidebar/bottom navigation de workspace. Autorização depende de `PASSWORD_RECOVERY`, é temporária e vinculada à sessão; sessão comum e `?update=1` não bastam. Mensagem neutra para pedido de e-mail, tratamento de expiração e reinicialização ao abrir um novo link sobre uma página expirada.
5. **Senha:** criação web e recuperação exigem oito caracteres, igual ao mobile existente. Login não exige trocar senhas antigas. A configuração de mínimo na API Auth continua sendo uma providência manual no painel.
6. **Encoding:** corrigidas quatro setas corrompidas em navegação; varredura dos fontes/documentação própria não encontrou outros casos semelhantes. Migrations históricas ficaram intactas.
7. **CI:** workflow GitHub Actions com `npm ci`, `typecheck`, `lint`, `test`, `build`; variáveis públicas fictícias, sem service role nem provedores. Smoke contra Supabase real permanece separado, fora do workflow.
8. **Headers:** `nosniff`, política de referrer, permissões, bloqueio de framing, CSP e HSTS na Vercel. Geolocalização/câmera própria, Supabase HTTP/WebSocket, ViaCEP, Nominatim e PDFs/impressão permanecem compatíveis. `X-Powered-By` removido.

## Banco e aplicação manual

Nova migration única: [`20260919010000_account_stabilization.sql`](../medinexus-web/supabase/migrations/20260919010000_account_stabilization.sql).

Não modifica arquivos SQL anteriores. A migration é transacional e não deve ser reexecutada. O guia [DATABASE_MIGRATION_SAFETY.md](DATABASE_MIGRATION_SAFETY.md) inclui inspeção do histórico remoto, triggers legados, passos para homologação/produção e configuração Auth. **Não usar `supabase db push` antes de reconciliar o histórico de pacotes executados manualmente.**

Aplicar primeiro em homologação, validar os três cadastros com confirmação de e-mail e só então aplicar em produção/publicar. Conferir mínimo de senha 8 e redirects de recuperação no Supabase. Nenhuma chave ou segredo novo é necessário para as correções.

## Validação executada

- `npm run typecheck`: passou.
- `npm run lint`: zero erros; 18 avisos preexistentes, sem bloqueio.
- `npm test`: **71 testes passaram**. Inclui aplicação da migration nova depois dos pacotes antigos, preservação de dados, tentativas de troca de perfil, proteção da verificação, CNPJ, recuperação, agenda, permissões clínicas e provedores desligados.
- `npm run build`: passou, com 45 páginas geradas.
- Mobile: **16 testes passaram** e TypeScript sem erros.
- Navegador com build de produção local e Auth/REST simulados: login dos três perfis (inclusive senha legada com seis caracteres), dashboard/perfil/configurações, bloqueio dos três caminhos de cadastro para contas completas, conclusão dos três tipos incompletos, novos cadastros aguardando e-mail, CNPJ inválido/válido/máscara/persistência, recuperação comum/expirada/válida e headers.
- Script de jornadas anteriores: passou; inclui alternativas de agenda com aceite explícito, rede, documentos emitidos/filtro, acesso separado a notas privadas, PDF curto em uma página A4 e conteúdo longo paginado.
- `git diff --check`: sem erro de whitespace. Os avisos LF/CRLF não alteram conteúdo de migrations antigas.
- Instalação limpa em diretório isolado e sem `.env`: **`npm ci`, `npm run typecheck`, `npm run lint`, `npm test` (71 testes) e `npm run build` passaram**, em sequência, com variáveis públicas fictícias e sem `SUPABASE_SERVICE_ROLE_KEY`. Lint manteve os 18 avisos anteriores. A cópia está em `medinexus-web/artifacts/stabilization-ci/`, ignorada pelo Git.

Os testes de navegador não enviaram e-mail, não criaram usuários nem documentos no Supabase real e não chamaram serviços clínicos/financeiros. O workflow foi preparado e reproduzido localmente; não houve execução remota no GitHub nesta sprint.

## Riscos e decisões deliberadas

- **Dependências:** a auditoria do npm nesta execução indicou 12 entradas vulneráveis (1 crítica, 7 altas, 3 moderadas, 1 baixa). A dependência direta `next` está marcada como crítica, com correção sugerida pelo npm em 16.3.5. Isso requer triagem dos advisories e atualização controlada antes de declarar prontidão de segurança. Não foi executado `npm audit fix --force` nem alterado o lockfile/versões nesta sprint; build aprovado não elimina esse risco.
- **Histórico remoto:** ainda exige inspeção/homologação. Um trigger Auth legado que crie `patients` indiscriminadamente para profissionais pode conflitar com a proteção nova; o guia manda verificar os corpos dos triggers antes da aplicação. Não foram apagados/desabilitados triggers remotos.
- **Verificação real:** o backfill é compatibilidade, não prova de CRM/CNPJ. Não houve consulta à Receita Federal/CFM nem aprovação automática. Esta estrutura inicial não implementa um novo processo de moderação nem altera a elegibilidade do agendamento por status; os bloqueios operacionais existentes continuam independentes.
- **CSP:** scripts/estilos inline permanecem permitidos para hidratação estática do Next e impressão existente; `unsafe-eval` só em desenvolvimento. Uma política estrita com nonces exigiria mudar a estratégia de renderização, fora desta correção. Imagens HTTPS externas continuam permitidas por compatibilidade com fotos/banners já cadastrados.
- **Recuperação:** o grant fica em memória por até 15 minutos; recarregar depois do consumo do link pode exigir outro e-mail. Entrega SMTP real e configuração do Auth não foram alteradas automaticamente.
- **Dados legados:** vínculos conflitantes já existentes, CNPJs antigos e campos originais foram preservados; não houve limpeza destrutiva ou criação de multi-role.
- **Integrações:** `PAYMENTS_ENABLED=false` e `CLINICAL_AI_ENABLED=false` continuam os padrões. Asaas continua apenas sandbox, comissão desligada, sem ativar cron/WhatsApp/IA. Imagem de assinatura continua não sendo ICP-Brasil.
- **Mobile e impressão:** testes locais não substituem homologação em dispositivos físicos ou publicação nas lojas.

## Arquivos alterados/criados

Paths relativos à raiz do repositório:

- `.github/workflows/ci.yml`
- `docs/DATABASE_MIGRATION_SAFETY.md`
- `docs/STABILIZATION_REPORT.md`
- `medinexus-mobile/src/account.ts`
- `medinexus-mobile/tests/account.test.mjs`
- `medinexus-web/next.config.ts`
- `medinexus-web/scripts/check-stabilization.mjs`
- `medinexus-web/src/app/clinica/configuracoes/page.tsx`
- `medinexus-web/src/app/clinica/medicos/[id]/page.tsx`
- `medinexus-web/src/app/clinica/medicos/novo/page.tsx`
- `medinexus-web/src/app/clinica/planos/page.tsx`
- `medinexus-web/src/app/components/registration-form.tsx`
- `medinexus-web/src/app/components/role-guard.tsx`
- `medinexus-web/src/app/components/verification-notice.tsx`
- `medinexus-web/src/app/lib/auth.ts`
- `medinexus-web/src/app/lib/cnpj.ts`
- `medinexus-web/src/app/lib/navigation.ts`
- `medinexus-web/src/app/lib/password-policy.ts`
- `medinexus-web/src/app/lib/recovery-session.ts`
- `medinexus-web/src/app/lib/registration.ts`
- `medinexus-web/src/app/lib/supabase.ts`
- `medinexus-web/src/app/medico/receituarios/[id]/page.tsx`
- `medinexus-web/src/app/recuperar-conta/page.tsx`
- `medinexus-web/supabase/migrations/20260919010000_account_stabilization.sql`
- `medinexus-web/tests/auth.test.mjs`
- `medinexus-web/tests/incremental-migrations.test.mjs`
- `medinexus-web/tests/stabilization-database.test.mjs`
- `medinexus-web/tests/stabilization.test.mjs`
