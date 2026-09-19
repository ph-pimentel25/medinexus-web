# Apresentação MediNexus

Site: https://medinexus-web.vercel.app

**Atualização de 17/09/2026:** nova interface e página Sobre publicadas em produção, com 48 verificações de páginas/perfis aprovadas após a implantação. As integrações externas continuam pendentes; consulte [o guia atualizado](GUIA_INTEGRACOES.md). O roteiro abaixo registra a apresentação anterior de 16/09/2026.

## Contas genéricas existentes

- Paciente: paciente@medinexus.com → /dashboard
- Médico: medico@medinexus.com → /medico/dashboard
- Clínica: clinica@medinexus.com → /clinica/dashboard

As senhas existentes foram preservadas. Use Sair da conta no menu antes de trocar de perfil.
A clínica fictícia está vinculada ao médico, à especialidade Clínica Geral/Médica e à agenda de segunda a sexta, das 08h às 18h.

## Roteiro da reunião

1. Abra a página pública da clínica e o catálogo de profissionais.
2. Entre como paciente. Mostre documentos e histórico: há uma consulta fictícia concluída e um resumo identificado como demonstração.
3. Para uma nova solicitação, abra a clínica pública e escolha Buscar atendimento nesta clínica. No formulário de busca, selecione consulta particular, a especialidade do médico e um dia/horário de segunda a sexta.
4. Entre como médico para confirmar a solicitação e acessar o perfil e a agenda.
5. Volte ao paciente para confirmar a presença.
6. No médico, abra a consulta e mostre o prontuário e a emissão de documentos.
7. Entre como clínica e mostre médicos, configurações, página pública, convênios e solicitações.

As funcionalidades de e-mail dependem das variáveis do Resend e de um remetente validado; o envio de e-mails não foi executado nos testes.
A busca respeita a disponibilidade médica e evita horários passados. A prevenção de concorrência entre solicitações de pacientes diferentes também depende das regras do banco.

## Ícone no celular

O projeto inclui manifest.webmanifest, ícones PNG de 192/512 pixels e apple-touch-icon de 180 pixels com o N da marca.
Se o atalho existente mantiver o ícone antigo, remova o atalho e adicione o site novamente à tela de início.

## Verificação

- npm test: 23 testes aprovados de identificação de perfil, destinos e horários.
- npm run typecheck: TypeScript.
- npm run lint: ESLint (avisos de manutenção remanescentes; sem erros).
- npm run build: compilação de produção.
- npm run test:smoke: páginas reais em navegador, usando exclusivamente as três contas genéricas acima. Requer servidor local e a chave secreta no .env.local. Não envia e-mails nem altera senhas; salva os perfis de médico e clínica com os valores atuais.

A versão publicada passou em 43 verificações de páginas e perfis, incluindo salvamento de configurações, redirecionamentos e navegação no celular e no computador.
scripts/smoke-registration.mjs também validou login por senha e conclusão do cadastro de paciente, médico e clínica com contas temporárias confirmadas, removidas ao final. A entrega da mensagem de confirmação por e-mail não foi testada.
Para testar produção, defina TEST_BASE_URL=https://medinexus-web.vercel.app antes de executar os scripts de navegador.

scripts/repair-demo-accounts.mjs mostra o plano de reparo; --apply aplica somente às três contas genéricas, sem exclusões.
scripts/verify-demo-flow.mjs testa a jornada no banco com sessões dessas contas e mantém um único exemplo identificado como demonstração.
artifacts/ contém relatórios e capturas locais e está fora do Git e do upload.

## Banco e implantação

A aplicação informa explicitamente patient_confirmation_status = not_requested ao criar solicitações, pois o valor padrão anterior do banco violava a restrição da tabela.
supabase/migrations/20260916_appointment_confirmation_default.sql está preparado para corrigir também o padrão no banco; essa migração não foi aplicada.

O projeto Vercel medinexus-web usa Root Directory = medinexus-web. A publicação via CLI deve ser feita a partir da pasta pai MediNexus. O outputFileTracingRoot em next.config.ts aponta para essa raiz do repositório, necessária ao empacotamento da Vercel.
Chaves secretas ficam somente no .env.local e nas variáveis de servidor da Vercel; nunca em variáveis NEXT_PUBLIC.
