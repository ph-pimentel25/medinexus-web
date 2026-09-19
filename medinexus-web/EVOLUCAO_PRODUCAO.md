# Evolução MediNexus — 18/09/2026

A arquitetura Next.js/Supabase/Expo e a paleta foram preservadas. **Versão web e APIs publicadas em produção em 18/09/2026**, em [medinexus-web.vercel.app](https://medinexus-web.vercel.app). Deployment Vercel `dpl_BdBWFzHMnEu3TMpKTYiDBixA5htP`, estado `READY`, build e TypeScript concluídos. Antes da publicação, a consulta somente leitura à API do Supabase confirmou a presença das tabelas, RPCs e campos verificados dos pacotes 17/09 e 18/09, incluindo `read_own_consultation_note`. Essa conferência não comprova integralmente políticas, triggers ou homologação transacional. Não reaplicar os pacotes sem conferir o estado do banco.

A política comercial foi consultada no banco: **comissão desativada**. O endpoint publicado de checkout retorna `available: false`, `environment: sandbox`. Nenhuma credencial de provedor ou cron foi ativado nesta publicação. A implantação na Vercel não publica o aplicativo nas lojas Android/iOS.

**Conferência após a publicação: 48 verificações de navegação em produção passaram, com zero falhas**, usando contas de demonstração de paciente, médico e clínica e acesso público, sem salvar cadastros ou consultas. Inclui destino correto por perfil, requisições, erros visíveis, menu móvel e ausência de transbordamento horizontal nas telas verificadas. Evidência local: `artifacts/smoke-production-readonly.json`. A página de recuperação respondeu HTTP 200; entrega de e-mail continua dependente de SMTP e homologação. Testes de navegação não substituem a homologação dos fluxos de escrita nem das integrações externas.

## Implementado neste incremento

| Área | Comportamento atual no código | Limite / dependência |
| --- | --- | --- |
| Disponibilidade do paciente | Entrada principal no site e app nativo. Matching no banco, duração integral, ocupação/concorrência, melhores encaixes primeiro. Alternativas até sete dias ao redor do período exigem concordância explícita. | Horários calculados em America/Sao_Paulo; homologar outros fusos antes de expansão. Cadastro precisa de coordenadas válidas. |
| Convênios | Operadora → plano/categoria e Outro. ID exato no matching, restrição do médico sobre os planos da clínica, alternativa particular explícita. Manual exige aprovação da equipe no backend. | Catálogo inicial de 15 referências, não completo. Não consulta elegibilidade/cobertura na operadora. Cadastrar variantes adicionais com identificação real. |
| Foto profissional | Upload pelo médico ou gestor autorizado, namespace validado, foto exibida na busca/rede/consultas/mobile. Novos agendamentos exigem foto. | Médicos antigos sem foto precisam cadastrar uma; consultas anteriores são preservadas. Foto/CRM informado não equivalem a identidade oficialmente verificada. |
| Rede e contatos | Rede em /profissionais, detalhes de especialidades/planos/particular/períodos de atendimento/avaliações, acesso pelo perfil. Descoberta inclui consultórios autônomos. Agenda pessoal de contatos externos manuais com RLS. | Places opcional ainda sem chave; contatos externos não ganham agendamento nem são apresentados como cadastrados. Períodos de trabalho não prometem horário livre. |
| Receitas/documentos | Medicamento primeiro, campos estruturados; afastamento apenas em atestado; área Documentos emitidos com filtros. Fluxo legado de receitas fica somente leitura, preservando o original. | Novos PDFs oficiais continuam bloqueados até certificação. Receitas antigas não são reinterpretadas/regravadas. Controlados/SNCR não homologados. |
| Histórico e IA | Fila após conclusão, versão nova quando registros mudam, consentimento separado, hash/origem/modelo, revisão médica antes de exibir ao paciente. Resumo antes da ficha; originais separados. Compartilhamento por médico com prazo e revogação. A coluna de notas privadas não é liberada ao paciente nem a outro médico pelo compartilhamento; o autor acessa suas próprias notas por RPC. | IA desligada; depende de contrato/configuração e avaliação clínica. A anamnese base compartilhada exige autorização do paciente. Auditoria ampla das políticas legadas ainda precisa ocorrer no banco real. |
| Avaliações | Histórico do paciente identifica médico e clínica da avaliação; anonimato público preservado. | Avaliações de paciente restritas à área médica; não substituem prontuário nem verificação profissional. |
| Pagamentos | Dinheiro como pagamento presencial pendente; cotações derivadas no servidor. Asaas PIX/cartão sandbox, checkout hospedado, webhook autenticado e idempotente, valores conferidos. Eventos de teste não quitam consultas reais. | **Sem cobrança real, sem comissão ativa.** Repasse, estorno/chargeback, onboarding de recebedores e produção financeira ainda pendentes. |
| ICP-Brasil | Guard de rascunho/certificação existente, contrato de provider e validação de intenção por médico/hash/ação consciente/expiração. Pesquisa oficial documentada. | Adapter real, PDF definitivo, verificação criptográfica e liberação ainda não implementados. Chaves sozinhas não resolvem isso. |
| Recuperação de conta | Tela /recuperar-conta, link no login e acesso a partir do aplicativo; mensagem sem enumerar contas e troca de senha via Supabase. | SMTP e redirect precisam configuração e teste de entrega real. |
| Impressão | Receita curta em uma página A4 no Chromium com viewport móvel; documento extenso continua em várias páginas. | Impressão nativa Android/iOS depende de teste em aparelhos/impressoras reais. |

## Decisões preservadas

- Pacientes usam o aplicativo integralmente de graça, sem paywall.
- Comissão efetiva zero. Percentuais históricos guardados apenas para eventual decisão futura; não ativados por plano ou variável pública.
- Nenhuma assinatura silenciosa. Sessão temporária do certificado depende das regras do fornecedor; cada documento exige ação consciente.
- Nenhum pagamento, assinatura, envio de mensagem ou processamento de dados clínicos reais foi realizado para testar fornecedores.
- Pedro informou não ter CNPJ, conta empresarial ou domínio. Contas/contratos continuam dependências externas.

## SQL — passos para homologação

1. Use um **projeto de homologação** com a estrutura existente da MediNexus. Não cole senhas nem chaves no SQL.
2. No Supabase → SQL Editor → New query, copie e execute [VERIFICAR_ATUALIZACOES.sql](supabase/VERIFICAR_ATUALIZACOES.sql). É somente leitura. Confira os resultados `base_16_*`, `pacote_17_*` e `pacote_18_*`.
3. A base de 16/09 já havia sido aplicada ao banco publicado, conforme seu retorno anterior. **Não repetir ATUALIZACAO_20260916.sql nesse banco.** Um projeto novo de homologação precisa receber primeiro a estrutura base correspondente.
4. Se os dois indicadores `pacote_17_*` forem `false`, execute **uma vez** [ATUALIZACAO_20260917.sql](supabase/ATUALIZACAO_20260917.sql). Se ambos forem `true`, pule este pacote. Se houver resultado misto, pare e identifique quais migrations já foram aplicadas; não tente resolver apagando tabelas.
5. Se todos os indicadores `pacote_18_*` forem `false`, execute **uma vez**, depois do pacote 17, [ATUALIZACAO_20260918.sql](supabase/ATUALIZACAO_20260918.sql). Se já aplicou as sete migrations individuais 30000–90000, não execute o pacote agregado. Resultados mistos exigem conferência dos arquivos aplicados. Os indicadores são uma verificação de presença, não um controle completo de versão.
6. O retorno esperado de cada pacote é `Success. No rows returned`. Cada pacote tem uma transação; se houver erro, copie somente a mensagem/linha. Não faça remoções para contornar erro de política/tabela já existente.
7. Execute novamente a consulta de verificação. Ela verifica presença, não todos os direitos de acesso.
8. Cadastre fotos nos médicos de teste; confira endereços/horários/especialidades e aceite de planos da clínica. Use contas distintas de paciente, médico e gestor.
9. Teste encaixe exato, ausência de encaixe/alternativa, horário ocupado, plano aceito, plano recusado com particular e Outro com confirmação. Um paciente não deve conseguir confirmar seu próprio convênio ou mudar a cotação.
10. No histórico do paciente, autorize um médico de teste e revogue depois. Confira a mudança efetiva no acesso. Para IA, use registros fictícios e mantenha `CLINICAL_AI_ENABLED=false` até as condições do relatório de integrações serem atendidas.
11. Publique o código no ambiente correspondente **depois** das migrations. Antes de publicar em produção, repetir a homologação aplicável, preparar backups de banco/arquivos e plano operacional. Não ligar cron de mensagens/IA automaticamente.

O pacote 17 contém duas migrations (comissão/cotação e conteúdo de documentos). O pacote 18 contém sete (foto, disponibilidade, catálogo, histórico IA, contatos, sandbox financeiro, preservação de receitas legadas). Não aplicam backfill de pagamentos/assinaturas; receitas históricas continuam preservadas. O pacote 18 atualiza RPCs do agendamento nativo para médicos com foto e consultórios autônomos.

## Evidências de validação local

Na publicação de 18/09, a verificação com o banco remoto identificou e corrigiu a lista de Documentos emitidos: o banco existente não possui a relação PostgREST `medical_documents → patients`. A tela agora resolve os nomes em consulta autenticada separada, preserva paginação e filtro por paciente, e usa a identidade registrada no documento como alternativa. O histórico compartilhado verifica a autorização antes de solicitar os registros; a RPC continua exigindo permissão no servidor. As correções passaram por lint e TypeScript e foram incluídas no deployment acima.

O teste de jornadas com dados simulados também passou contra os arquivos da versão publicada: filtro de documentos sem relação entre tabelas, atendimento com acesso separado a notas privadas, ausência de autorização do histórico, alternativas de agenda, recuperação de conta e PDFs curto/longos. Esses testes não enviaram dados clínicos a provedores externos.

- **53 testes web/backend passaram**, incluindo execução conjunta dos dois pacotes SQL sobre fixture da versão anterior, preservação de receita legada, RLS, revogação, revisão IA, planos, alternativas, consultório autônomo, duração fraudada e webhook financeiro duplicado/valor divergente.
- **14 testes do aplicativo nativo passaram** e TypeScript nativo sem erros.
- Exportação de bundles **Android e iOS** concluída. Isso não é APK/IPA assinado nem publicação em loja.
- Build web de produção concluído; TypeScript sem erros e lint com zero erros e 18 avisos remanescentes.
- Navegador Chromium em 390 px, também com o build de produção local: nove rotas de paciente/médico, abertura do atendimento médico com RPC de notas privadas, detalhes da rede e controles de compartilhamento, identificação em avaliações, Documentos emitidos, recuperação, checkbox obrigatório de alternativa + particular, PDF curto uma página e PDF longo paginado. Dados simulados; não é homologação com contas/provedores reais.
- Evidências locais de navegador/PDF em `artifacts/new-journeys/` (pasta ignorada pelo Git).

## Dependências ainda abertas

Detalhes e ações do Pedro em [ROADMAP_INTEGRACOES.md](ROADMAP_INTEGRACOES.md): ICP real e SNCR conforme escopo, financeiro em produção/repasse, verificação oficial CRM/identidade, Resend/SMTP, WhatsApp/templates/callbacks, geocodificação em escala, tratamento de dados clínicos na IA, observabilidade, auditoria, backups de objetos, requisitos das lojas/push/exclusão de conta. Nenhuma dessas integrações foi contratada ou ativada automaticamente.
