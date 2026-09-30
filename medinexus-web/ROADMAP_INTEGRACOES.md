# MediNexus — integrações, homologação e providências

Revisão: **29/09/2026**. Roadmap atualizado após inspeção do código web/mobile, migrations, adapters e registros de testes. A publicação de 18/09 está documentada em [EVOLUCAO_PRODUCAO.md](EVOLUCAO_PRODUCAO.md); as correções locais posteriores não devem ser tratadas como publicadas. Esta revisão não fez push, deploy, aplicação de SQL, contratação ou ativação de serviços.

**Leitura do estado:** “implementado” significa presente no código; “validado localmente” significa testes locais; “concluído por Pedro” registra sua confirmação; “homologado em produção” exige evidência do fluxo com as contas e fornecedores daquele ambiente. As tarifas das seções técnicas são referências da pesquisa anterior, não foram todas recotadas nesta revisão. Conferir a proposta vigente antes de contratar.

## Onde a MediNexus está hoje

O produto já possui os fluxos centrais e uma base técnica testada. O próximo marco é **um piloto acompanhado que consiga concluir agendamentos reais com previsibilidade**. Ainda não há evidência suficiente para declarar a operação clínica, financeira e documental completa em produção.

| Área | O que já está feito | O que ainda falta |
| --- | --- | --- |
| Domínio e e-mail | Domínio próprio/Vercel, contato@medinexus.com.br, Resend SMTP, cinco passos de configuração/teste e templates concluídos por Pedro | Confirmar operação contínua dos avisos de consulta; cron e callbacks não ficam comprovados só pela configuração SMTP |
| Segurança e contas | Sprint preservada em `e305631`; Next/eslint 16.3.6 e audit zerado na conferência de 29/09 em `38970de`; React mantido | Publicar de forma controlada após homologação; aplicar a migration de estabilização apenas quando autorizado e após conferir histórico/triggers |
| Disponibilidade e localização | Matching no banco; alternativas com aceite; correções locais do CTA, ícones, validação de datas, GPS/CEP e preservação de coordenadas | Publicar as correções, testar endereços reais e reserva concorrente com contas separadas; comprovar oferta suficiente na região piloto |
| Qualidade local | Última rodada: 81 testes web/backend, build e TypeScript aprovados; lint sem erros/16 avisos; jornada de GPS e agendamento validada com fixtures | Esses resultados não comprovam cadastro real, entrega de mensagens ou atendimento concluído em produção |
| Profissionais/convênios | Foto obrigatória, catálogo inicial, plano específico/Outro e estrutura de status profissional | Processo de verificação, aprovação com acesso restrito e uso desse status no agendamento; lista de planos confirmada por cada clínica |
| Documentos | Layout, emissão em rascunho, assinatura visual autorizada e contrato de integração | Provider ICP real, PDF definitivo, validação criptográfica, armazenamento/entrega do original assinado |
| Pagamentos | Dinheiro presencial registrado e Asaas apenas sandbox com webhook | Produção, recebedores, repasse, cancelamento/estorno, reconciliação e contratos; comissão segue desligada |
| IA clínica | Fila, consentimento, resumo separado do original e revisão médica no código | Avaliação com médicos, tratamento contratual de dados e homologação; ativação não confirmada e não recomendada antes desses critérios |
| App móvel | Projeto Expo Android/iOS e testes locais | Aparelhos reais, requisitos de conta/privacidade, builds assinados, push e lojas |

Evidências: [segurança](../docs/DEPENDENCY_SECURITY_2026-09-29.md), [busca/localização](../docs/AVAILABILITY_LOCATION_2026-09-29.md), [segurança de migrations](../docs/DATABASE_MIGRATION_SAFETY.md). As alterações de busca e documentação continuam no diretório de trabalho, além dos dois commits locais. Os arquivos que Pedro está ajustando para os e-mails não foram reescritos nesta revisão.

**Decisão comercial vigente:** paciente usa todos os recursos gratuitamente. Comissão MediNexus desativada. Não há cobrança de assinatura profissional ativa. Não definir agora a monetização das consultas. Taxas do processador de pagamento são custos de terceiros e não desaparecem com comissão zero; a responsabilidade por elas deve constar do contrato antes da operação real.

## Atualização de domínio e e-mail — 29/09/2026

- Pedro informou: domínio próprio **medinexus.com.br**, cadastrado na Vercel; e-mail institucional **contato@medinexus.com.br**; Resend SMTP configurado no Supabase.
- Conferência pública somente leitura: A do domínio `216.198.79.1`; CNAME de `www` para `f8975a7efccf1dc9.vercel-dns-017.com`; MX do Zoho com prioridades 10/20/50. HTTPS do domínio raiz retorna **308 para https://www.medinexus.com.br/**; `www` retorna **200**. Portanto, a URL canônica observada é **https://www.medinexus.com.br**.
- A captura de DNS mostra SPF/DKIM do Zoho, DKIM do Resend e subdomínios de envio. Preservar os MX do Zoho. A conferência do status Verified e os testes dos cinco passos foram depois informados como concluídos por Pedro; não pedir para recriar conta/domínio ou repetir a configuração sem um problema concreto.
- Nenhuma alteração de DNS, Vercel, Supabase, secrets ou envio de mensagem foi feita nesta conferência. A atualização local de segurança não foi publicada. CNPJ e conta empresarial continuam sem confirmação.

### Configuração concluída por Pedro — registro dos cinco passos

Pedro informou que concluiu **todos os cinco passos abaixo**, incluindo as configurações de retorno, Resend/SMTP, testes indicados, variáveis na Vercel e API dos avisos. Também personalizou os modelos de e-mail no Supabase. Registro baseado na confirmação de Pedro; não foram inspecionados os painéis nem enviados e-mails nesta revisão. As instruções permanecem como referência de manutenção, não como tarefas a repetir. A personalização dos e-mails não publica as alterações locais de busca/segurança.

1. No **Supabase → Authentication → URL Configuration**, conferir **Site URL = `https://www.medinexus.com.br`** e adicionar os retornos exatos usados pelo código: `https://www.medinexus.com.br/login` e `https://www.medinexus.com.br/recuperar-conta?update=1`. Preservar URLs de homologação ainda utilizadas; evitar wildcard amplo para produção. [Documentação oficial](https://supabase.com/docs/guides/auth/redirect-urls).
2. No **Resend → Domains**, conferir se `medinexus.com.br` está **Verified**. No SMTP do Supabase, conferir o remetente autorizado `contato@medinexus.com.br`, nome MediNexus e os dados da conta já configurada. [Integração SMTP](https://resend.com/docs/send-with-supabase-smtp).
3. Homologar cadastro e recuperação com uma conta de teste própria no domínio oficial, conferindo inbox/spam, logs do Supabase/Resend e destino do link. A sprint de estabilização está apenas local; validar novamente após sua publicação autorizada. Nunca compartilhar links com token de recuperação.
4. Para o próximo deploy autorizado, conferir **Vercel → projeto medinexus-web → Environment Variables → Production**: `NEXT_PUBLIC_APP_URL=https://www.medinexus.com.br`. A URL precisa coincidir com a canônica. Não houve deploy nesta etapa.
5. Avisos de consulta usam a **API do Resend**, separada do SMTP. Configuração informada como concluída: `RESEND_API_KEY` e `RESEND_FROM_EMAIL=MediNexus <contato@medinexus.com.br>` no servidor. Só ativar o processamento após revisar a fila e testar com destinatário consentido. Não habilitar cron apenas por ter configurado SMTP.

Esta atualização documental permanece fora dos dois commits locais de estabilização/segurança, para não misturar integrações no commit exclusivo de dependências.

## Começar hoje, Pedro

1. **⚠️ PROVIDENCIAR IMEDIATAMENTE — formalização.** Domínio já providenciado. CNPJ e conta empresarial continuam sem confirmação: contrate contador para definir a empresa, atividade e conta bancária apropriadas. Não é necessário esperar a empresa ficar pronta para desenvolver e pedir demonstrações. Para contratos de marketplace, verificação de empresa e repasses, confirme com cada fornecedor os requisitos de pessoa jurídica.
2. **⚠️ PROVIDENCIAR IMEDIATAMENTE — assinatura.** Entre nos canais comerciais de [BRy](https://bry-developer.readme.io/reference/assinatura-com-certificado-na-nuvem), [Soluti](https://idtech.soluti.com.br/portal-de-integracoes) e [Certisign](https://desenvolvedor.certisign.io/docs/guias/assinaturas/). Peça proposta e homologação para **prescrição médica, PDF/PAdES, certificado ICP-Brasil em nuvem e assinatura individual consciente**. Solicite documentação, credenciais de teste, limites de sessão, revogação, autenticação adicional, validação criptográfica e preços por médico/documento. Não basta contratar uma imagem de assinatura ou um certificado sem API compatível.
3. **⚠️ PROVIDENCIAR IMEDIATAMENTE — pagamentos.** Crie uma conta no [Sandbox Asaas](https://sandbox.asaas.com/). Solicite ao atendimento validação do seu cenário: plataforma de consultas, médicos/clínicas recebedores, sem comissão inicial, PIX/cartão, cancelamento, estorno e repasse. Peça requisitos de marketplace/subcontas e documentação de identificação dos recebedores. O sandbox pode avançar antes da produção. [Introdução oficial](https://docs.asaas.com/docs/visao-geral).
4. **Completar a operação de avisos de consulta.** Configuração Resend/SMTP e testes dos cinco passos concluídos por Pedro. O que falta comprovar é o cron de consultas, processamento da fila, tratamento de falhas e confirmação de entrega; não refazer a configuração inicial.
5. **⚠️ PROVIDENCIAR IMEDIATAMENTE — profissionais do piloto.** Separe médicos/clínicas participantes, responsável pelo cadastro, CRM/UF, documento de identidade e certificado para homologação. Consulte o [serviço de consulta de médicos do CFM](https://crmvirtual.cfm.org.br/BR/servico/web-service---listagem-de-medicos): o acesso empresarial depende de adesão e chave, não de uma API pública anônima.

Depois, informe no chat **apenas**: nome do fornecedor escolhido, ambiente sandbox ou produção, número de protocolo e link da documentação recebida. O domínio já está registrado neste roadmap. Cadastre chaves diretamente nas variáveis da hospedagem/ambiente de homologação. Não cole segredos, certificados privados, senhas ou documentos pessoais aqui.

## Prioridades ligadas ao código

| Integração / providência | Classificação | Situação no projeto |
| --- | --- | --- |
| Publicação controlada, disponibilidade e localização | **1. CRÍTICA AGORA** | Correções locais prontas; validar fluxo completo com a rede piloto e reconciliar banco/código antes de publicar |
| ICP-Brasil, PDF assinado, verificação de identidade e emissão médica | **1. CRÍTICA AGORA** | Rascunhos protegidos no banco; contrato de adapter; fornecedor e verificação criptográfica pendentes |
| PIX/cartão e desenho de recebimento/repasse | **1. CRÍTICA AGORA** | Checkout Asaas sandbox e webhook preparados; dinheiro presencial; produção e repasses pendentes |
| Domínio, e-mail transacional, autenticação e recuperação | **1. CRÍTICA AGORA** para validar a versão nova | Configuração inicial e templates concluídos por Pedro; manter os testes de acesso após publicar e fechar operação dos avisos de consulta |
| CRM e identidade profissional | **1. CRÍTICA AGORA** | CRM informado no cadastro não equivale a CRM verificado; API/KYC pendentes |
| Contratos, LGPD, responsáveis e tratamento de dados clínicos | **1. CRÍTICA AGORA** | Consentimentos e permissões implementados parcialmente; governança e revisão jurídica pendentes |
| Banco, Storage privado, backups e restauração | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | Supabase existente; buckets e RLS; recuperação operacional não homologada |
| WhatsApp e fila de mensagens | **2. NECESSÁRIA ANTES DO MVP/PILOTO** se WhatsApp fizer parte da promessa | Worker/Twilio preparados; remetente/templates/callbacks pendentes. Piloto acompanhado pode começar com e-mail homologado, se esse recorte for aprovado |
| IA de resumo clínico | **4. PODE ESPERAR** no piloto de agendamento; **2** se incluída | Código preparado; não ativar antes de avaliação médica e aprovação do tratamento de dados |
| Monitoramento, auditoria e alertas | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | Logs básicos e auditoria de leitura do histórico; observabilidade abrangente pendente |
| Endereços e geocodificação para o matching | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | ViaCEP/Nominatim/GPS; precisa homologar qualidade e capacidade de uso |
| Verificação da aceitação de planos | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | Catálogo e matching por ID; manual exige confirmação; não consulta elegibilidade na operadora |
| Direitos do titular, privacidade e solicitações de conta | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | Falta fluxo operacional completo de solicitação/exportação/desativação, compatível com retenção dos registros; não depende das lojas |
| Publicação Android/iOS e push | **3. NECESSÁRIA ANTES DE PRODUÇÃO nas lojas** | Código Expo; builds assinados, testes reais, push e requisitos das lojas pendentes; não bloqueia um piloto web acompanhado |
| Busca externa Google Places / IA de especialidades | **4. PODE ESPERAR** | Adapter existente; busca dos cadastrados e matching não dependem deles |
| SMS, Google/Outlook Calendar, analytics de marketing | **4. PODE ESPERAR** | Sem integração; não necessários para o primeiro atendimento presencial |
| Telemedicina/videoconferência | **4. PODE ESPERAR** | Fora do fluxo presencial atual; exige escopo, fornecedor e homologação próprios |
| Assinaturas comerciais e comissão automática | **4. PODE ESPERAR** | Infraestrutura de comissão guardada e desativada; preços não definidos |

“Pode esperar” não significa substituir uma função por simulação: a interface deve informar indisponibilidade quando o fornecedor não estiver ativo.

## MVP recomendado: provar primeiro o agendamento por disponibilidade

**Recomendação de escopo, não alteração das regras já aprovadas:** começar com piloto web responsivo/PWA, presencial, em uma região, com 2–3 especialidades e uma rede pequena acompanhada. Como ponto de partida para planejamento, recrutar 2 clínicas, 5–10 médicos e 20–50 pacientes voluntários; são metas propostas, não cadastros existentes nem requisito regulatório. Expandir depois de comprovar o fluxo.

A jornada que precisa funcionar sem improviso é: **cadastro → endereço conferido → dias/horários do paciente → encaixe ou alternativa explicada → solicitação → confirmação da clínica → lembrete → comparecimento → conclusão/avaliação**. Disponibilidade confiável e resposta da clínica são o diferencial; uma lista grande de contatos externos sem agenda não comprova esse diferencial.

Para um piloto focado em agendamento, IA, lojas, Places, telemedicina e calendário externo podem esperar. Documentos oficiais e cobrança online só entram quando suas próprias integrações estiverem homologadas. Se forem parte obrigatória do lançamento escolhido, ICP e financeiro tornam-se critérios de saída antes de receber usuários reais nesses fluxos. Não apresentar rascunho como receita válida ou checkout sandbox como pagamento real. Paciente gratuito e comissão zero permanecem.

### Ordem das próximas frentes

| Ordem | Trabalho concreto | Evidência para considerar concluído | Responsável/dependência |
| --- | --- | --- | --- |
| 1 | Fechar a versão e homologar banco/código | Revisão do diff, migrations conciliadas sem repetição, backup, CI verde, 3 papéis validados; deploy e SQL apenas com autorização | Desenvolvimento + Pedro para ambientes/publicação |
| 2 | Disponibilidade e localização confiáveis | Casos de encaixe exato/alternativo, sem resultado, raio curto/longo, fuso, dois pacientes disputando horário, consulta ocupada/cancelada; endereços reais conferidos pelo participante | Desenvolvimento + médicos/clínicas do piloto |
| 3 | Cadastro assistido da rede | Cada médico com foto, identidade/CRM conferidos, endereço, agenda real, duração, valor, modalidade e planos; cada clínica responsável pela atualização | Pedro + clínica; fluxo administrativo a implementar |
| 4 | Operação diária da clínica | Fila pendente com responsável, prazo de resposta, confirmação, recusa, remarcação, cancelamento, ausência e conclusão testados ponta a ponta | Desenvolvimento + responsável de recepção |
| 5 | Mensagens observáveis | Solicitação e confirmação distintas, lembrete adequado, cancelada/remarcada sem lembrete antigo, reprocessamento seguro e entrega acompanhada | Resend já configurado; cron/callbacks e operação pendentes de validação |
| 6 | Segurança e suporte do piloto | Acesso cruzado bloqueado, aprovação profissional no backend, auditoria, backup restaurado, canal do titular e suporte funcionando | Desenvolvimento + responsáveis operacionais/jurídicos |
| 7 | Emissão oficial e financeiro | Assinatura real validada e PDF original entregue; PIX/cartão reais apenas após recebedores/repasses/estornos homologados | Provider ICP, Asaas e formalização; abrir solicitações desde já |
| 8 | Acompanhar uso, corrigir e expandir | Métricas da jornada e entrevistas; problemas recorrentes resolvidos antes de ampliar regiões/especialidades | Pedro + desenvolvimento + participantes |

### Lacunas de produto que não se resolvem contratando uma API

1. **Diagnóstico de resultado vazio.** A tela atual dá uma orientação geral. Evoluir para distinguir falta de localização, ausência de rede na área, ausência de agenda e restrição de modalidade/plano, sem revelar consultas de outros pacientes. Mostrar o filtro aplicado e oferecer ampliar raio/período com ação explícita. Não alargar automaticamente os limites ou converter convênio em particular.
2. **Agenda real e atualizada.** Conferir bloqueios pontuais, feriados/férias e intervalos da clínica. Auditar o suporte atual e completar exceções onde faltar, mantendo a agenda recorrente existente. Testar remarcação e concorrência contra as mesmas regras do banco. Fuso atual é Brasília: não abrir cobertura nacional sem homologar outros fusos.
3. **Verificação profissional com efeito real.** `verification_status` foi preparado, mas `match_patient_availability` e o guard de agendamento ainda usam atividade/foto, não esse status. Criar processo restrito de análise/aprovação/suspensão e aplicar elegibilidade no backend. O backfill legado `verified` da migration de estabilização é compatibilidade técnica, não comprovação documental; revisar os participantes antigos. Não alterar a migration histórica para isso: planejar evolução aditiva após definir a regra.
4. **Painel operacional mínimo.** Não foi encontrada uma área administrativa central para analisar profissionais, investigar solicitações, consultar filas com erro e acompanhar suporte. Implementar papéis restritos e trilha de auditoria, sem dar acesso clínico geral à recepção ou ao suporte. Não expor service-role no painel.
5. **Respostas e estados compreensíveis.** “Solicitado” não é “confirmado”; confirmar consulta não é confirmar pagamento nem cobertura do convênio. Definir quem age em cada estado, prazo acordado da clínica e como o paciente acompanha atrasos. Auditar fluxo existente de cancelamento/remarcação em vez de criar outro paralelo.
6. **Cadastro com progresso.** Mostrar ao médico/clínica o que falta para receber agendamentos e ao paciente o que impede a busca. Validar planos específicos com a clínica; completar o catálogo segundo a rede piloto, mantendo “Outro — confirmação necessária”.
7. **Suporte e direitos do titular.** Canal contato@medinexus.com.br existe; definir responsável, horário e procedimento. Implementar solicitação de acesso/exportação/desativação/exclusão conforme política de retenção aprovada, sem prometer apagar prontuários indiscriminadamente. Revisar privacidade, termos, menores/dependentes e avaliações de pacientes antes de ampliar acesso.
8. **Dados e métricas seguros.** Instrumentar apenas eventos necessários da jornada, evitando endereço exato, CPF, nome, termos clínicos, texto de documentos e replay de sessão. Medir o motivo de abandono e não apenas visitas ao site.

### Critérios de liberação do piloto

- [ ] Versão nova publicada no ambiente autorizado e migration de estabilização conferida/homologada, com plano de retorno.
- [ ] Profissionais do piloto realmente conferidos; teste prova que pendente/suspenso não contorna a regra pelo navegador ou API depois da evolução de elegibilidade.
- [ ] Paciente conclui cadastro, confirma e-mail, recupera senha e entra no papel correto no celular.
- [ ] Participante confere a origem da busca; CEP/GPS não deslocam silenciosamente o endereço. Raio e endereço da clínica corretos em casos conhecidos.
- [ ] Reserva concorrente resulta em no máximo uma ocupação; alternativas e particular exigem consentimento explícito; cancelamento libera corretamente a agenda.
- [ ] Recepção consegue confirmar, remarcar, cancelar e concluir; não há consultas abandonadas sem responsável.
- [ ] E-mails da consulta percorrem a fila, chegam ao destinatário de teste e têm falhas investigáveis; WhatsApp homologado se prometido no piloto.
- [ ] Contas distintas não acessam prontuários/documentos sem autorização; notas privadas continuam privadas; revogação é testada no banco real de homologação.
- [ ] Backup do banco **e dos arquivos** restaurado em ambiente isolado, com responsável, perda máxima tolerada e tempo de recuperação acordados. [O backup de banco do Supabase não inclui os objetos Storage](https://supabase.com/docs/guides/platform/backups).
- [ ] Política, termos, contratos dos participantes, suporte e procedimento de incidentes aprovados pelos responsáveis.
- [ ] Nenhum recurso não homologado é anunciado como disponível. ICP/pagamento/IA passam por critérios próprios antes de serem habilitados.

### Como saber se o MVP está melhorando

Métricas propostas para o piloto, ainda sem valores medidos: conclusão de cadastro; buscas com encaixe exato; buscas com alternativa; buscas sem resultado por motivo; busca → solicitação; solicitação → confirmação; tempo de resposta da clínica; comparecimento; cancelamento/ausência; falhas de localização; falhas de mensagem; erros por jornada. Separar ausência real de oferta de erro técnico.

Como meta inicial de qualidade, propor que pelo menos 9 de 10 participantes consigam buscar e solicitar sem ajuda, com todos os cenários críticos de acesso/concorrência aprovados. A clínica deve assumir um prazo de resposta em horário de atendimento; medir esse prazo antes de exibi-lo como promessa ao paciente. Realizar uma revisão semanal dos erros e conversas curtas com pacientes e recepção. Não atribuir porcentagem de “MVP pronto” sem esses resultados.

## Referência técnica das integrações

As seções abaixo mantêm credenciais, endpoints e pendências específicas. URL futura é proposta, não endpoint já disponível; credenciais sozinhas não concluem integração. Valores comerciais são referências anteriores sujeitas a nova confirmação.

## 1. Assinatura, documentos, PDF e validação

**Para que serve:** emitir o PDF original assinado pelo médico e permitir conferir sua integridade e autoria. Entra em `medical_documents`, `guard_certified_document`, tela de emissão, `certified-signature-provider.ts`, armazenamento e entrega ao paciente. Hoje a imagem desenhada é apenas representação visual; documentos novos continuam em rascunho até certificação. Os PDFs de prévia e QR da aplicação não atestam ICP-Brasil.

**Fornecedor recomendado para primeira prova técnica:** BRy, pela documentação explícita de assinatura de PDF com certificado em nuvem e pré-autorização. Alternativas: Soluti/Bird ID com API de assinatura compatível, Certisign/RemoteID, Lacuna. **Não houve seleção contratual nem comprovação de compatibilidade do certificado do médico.** Preço de API, validação, certificado em nuvem, carimbo de tempo e volume: solicitar proposta. O [programa de certificado do CFM](https://certificadodigital.cfm.org.br/) pode atender médicos elegíveis; não inclui automaticamente a integração da MediNexus.

**Conta/documentos:** cadastro comercial da plataforma, responsável técnico/comercial, dados empresariais exigidos pelo fornecedor; para o médico, CRM/UF, identidade e certificado elegível. Sandbox/homologação devem ser solicitados. A [BRy documenta ambiente de homologação](https://bry-developer.readme.io/reference/integra-bry); regras e credenciais não são intercambiáveis entre fornecedores.

**Sessão no início do expediente:** a BRy documenta pré-autorização para certificados em nuvem. Isso **não comprova autorização por um expediente inteiro**, nem dispensa consentimento para cada documento. Precisamos confirmar TTL, escopos, limite de assinaturas, renovação, revogação e exigência de OTP/biometria com o provedor. A interface prevista é: médico autentica o certificado → revisa o documento → clica em “Assinar este documento” → sistema vincula essa ação ao hash do PDF. Expiração exige nova autenticação. O contrato de código já rejeita autorização expirada/revogada e ação não vinculada ao médico/documento. Nenhum adapter real está autorizado a emitir ainda.

**Gov.br:** conta Ouro não transforma toda assinatura em ICP-Brasil. A assinatura do serviço Gov.br é descrita como **avançada**; assinatura qualificada usa certificado ICP-Brasil. Acesso da aplicação privada à API Gov.br também precisa ser confirmado, não presumido. [ITI — assinatura avançada](https://www.gov.br/iti/pt-br/assuntos/assinatura-eletronica-avancada), [integração Gov.br](https://manual-integracao-assinatura-eletronica.servicos.gov.br/pt-br/3.5/iniciarintegracao.html). O CFM informa assinatura qualificada na regulamentação de documentos eletrônicos médicos: [orientação oficial sobre a Resolução 2.381/2024](https://portal.cfm.org.br/noticias/cfm-atualiza-resolucao-que-regulamenta-emissao-de-atestado-medico).

**⚠️ Receitas controladas/SNCR:** não liberar modelos controlados como se bastasse assinar o PDF genérico. A Anvisa informou cronograma de integração e novos modelos; a disponibilidade operacional precisa ser confirmada na data da implantação. A [página oficial de receituário eletrônico](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/receituario-eletronico) e os [esclarecimentos de prazos](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/receituarios-de-medicamentos-controlados-anvisa-esclarece-prazos-e-regras-em-vigor) são a referência. O QR oficial de uma receita SNCR segue regras próprias; não substituí-lo pelo QR interno. SNCR **não está integrado**.

**Credenciais/URLs:** após escolher o fornecedor, provisionar credenciais exclusivamente no servidor. Nomes propostos, ainda não consumidos: `SIGNATURE_PROVIDER`, `SIGNATURE_CLIENT_ID`, `SIGNATURE_CLIENT_SECRET`, `SIGNATURE_WEBHOOK_SECRET`. Reservar, **sem cadastrar como operacionais ainda**, `https://DOMINIO/api/signatures/callback` e `https://DOMINIO/api/webhooks/signatures`. O formato exato depende do protocolo contratado; não existem endpoints operacionais nessas URLs nesta entrega.

**Painel:** liberar aplicação e redirect exato, ambiente de teste, escopos, webhook autenticado, certificados/usuários de homologação. **Sem credenciais posso:** manter interfaces, autorização por documento, estado rascunho, testes de recusa e layout. **Ainda exige desenvolvimento + homologação:** gerar PDF definitivo no servidor, congelar hash, adapter real, validar cadeia/revogação/titular/PAdES, processar callback, guardar bytes originais em bucket privado e entregar URL temporária. [VALIDAR ITI](https://validar.iti.gov.br/guia-desenvolvedor.html) ajuda na verificação; um resultado visual/QR não deve ser convertido cegamente em `certificate_verified_at`.

## 2. PIX, cartão, dinheiro e repasse

**Por que:** a confirmação de uma consulta não confirma pagamento. O projeto usa `appointment_payment_quotes` para valor calculado no banco e dinheiro como `cash_due`. O novo adapter chama checkout hospedado Asaas em **sandbox**, sem receber dados de cartão nem enviar conteúdo clínico. As tabelas de checkout/teste e eventos são separadas: `paid_test` nunca marca uma consulta real como paga. Comissão permanece zero.

**Recomendação:** Asaas para a primeira homologação; alternativas para cotar marketplace: Pagar.me e Mercado Pago. Comparar onboarding, split, estornos, antifraude, recebíveis, suporte e contratos; não contratar só pelo percentual. Asaas tem sandbox. Sua [tabela pública](https://www.asaas.com/precos-e-taxas) mostra preço padrão PIX de R$ 1,99 por recebimento e cartão à vista R$ 0,49 + 2,99%, além de promoções temporárias. **Condições da conta/contrato prevalecem**. Não usar tarifa promocional como orçamento permanente.

**Pedro, faça:**

1. Cadastre-se no sandbox e gere a API key de homologação. Não use chave de produção.
2. Em ambiente de homologação da MediNexus, cadastre `PAYMENTS_ENABLED=true`, `PAYMENT_ENVIRONMENT=sandbox`, `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` aleatório com pelo menos 32 caracteres. Defina `NEXT_PUBLIC_APP_URL` com a URL HTTPS desse ambiente e as credenciais Supabase correspondentes.
3. Publique somente depois de aplicar as migrations novas em homologação. A rota `GET /api/payments/checkout` informa a disponibilidade; `POST` exige sessão de paciente e consulta particular confirmada com preço cadastrado.
4. No Asaas, configure webhook para `https://DOMINIO-HOMOLOGACAO/api/webhooks/asaas`, API v3, envio sequencial, eventos `CHECKOUT_CREATED`, `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`. Configure o mesmo segredo como `authToken`; ele chega no header `asaas-access-token`.
5. Use paciente e consulta **fictícios**. Abra o pagamento da consulta e use “Testar PIX”/“Testar cartão”. O checkout retorna para `/consultas`; esse redirect **não** confirma pagamento. Confira evento, valor, ID e `paid_test` no banco. [Eventos oficiais](https://docs.asaas.com/docs/eventos-para-checkout).
6. Teste duplicação de webhook, valor divergente, cancelamento e erro de rede. `unknown` exige conferência no Asaas; não repetir criação cegamente. O código bloqueia duplicação de checkout para a mesma cotação.

**Produção bloqueada por desenho, não só por chave:** ainda faltam recebedores, verificação de titularidade, reconciliação de estorno/chargeback, regras de cancelamento e homologação financeira. A API de produção não é chamada por este adapter. Precisamos decidir juridicamente quem recebe e como o valor chega à clínica/médico; não presumir repasse manual pela conta da plataforma. [Split Asaas](https://docs.asaas.com/docs/split-de-pagamentos) trabalha sobre valor líquido e depende dos recebedores/wallets. **Não configure split de comissão agora.** Cadastro/contratos, conta recebedora, identidade, dados fiscais e bancários dependem do fornecedor e da modalidade. Obter a lista exata com o atendimento. Desenvolvimento de integração não é autorização para movimentar dinheiro real.

## 3. Autenticação, recuperação e e-mail

**Recomendação:** manter Supabase Auth e Resend; alternativas de SMTP: SES/Postmark. Código já usa autenticação centralizada, cadastro por papel e `/recuperar-conta`; médico/gestor não ganha acesso só por autodeclarar papel no navegador. Worker de consultas usa Resend por API; e-mail de login/cadastro/recuperação usa **SMTP do Supabase**, separadamente. Pedro informou ter concluído configuração e testes de cadastro/recuperação e personalizado os modelos. Falta evidência operacional contínua dos avisos de consulta e revalidar a versão nova quando publicada.

**Custos/conta:** [Resend](https://resend.com/pricing): gratuito 3.000/mês, limite 100/dia; Pro US$ 20/mês/50.000. Conta, domínio e configuração inicial já providenciados por Pedro; manter acesso administrativo ao DNS e acompanhar DKIM/SPF no painel. CNPJ pode ser exigido em contratação comercial, não pressuposto para todo teste. Testes iniciais usam destinatários permitidos pelo fornecedor; teste de entrega real exige domínio/remetente válido.

**Variáveis:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`; `SUPABASE_SERVICE_ROLE_KEY` só servidor. `RESEND_API_KEY`, `RESEND_FROM_EMAIL` para mensagens; credenciais SMTP ficam no painel do Supabase. **Painel:** Authentication → SMTP Settings; URL Configuration → Site URL oficial e redirects exatos `/login`, `/recuperar-conta?update=1`, equivalentes de homologação. A recuperação mobile abre a web; não inventar deep link nativo não implementado. [Senhas/recuperação](https://supabase.com/docs/guides/auth/passwords), [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls).

**Sem credenciais:** formulários, estados, validação, fluxos de sessão e worker preparados. **Pendente:** revalidar a versão nova, limites/antispam, revogação de sessões e MFA profissional conforme risco; operar e monitorar os avisos de consulta. A configuração inicial informada como concluída não está sendo reaberta. Callbacks de entrega/bounce do Resend ainda não implementados; URL proposta `/api/webhooks/resend` **não deve ser configurada até existir**. SMTP não exige webhook para funcionar.

## 4. WhatsApp, SMS e processamento das mensagens

**WhatsApp — prioridade 2, ⚠️ abrir cadastro agora se for promessa do piloto.** Recomendado Twilio, pois `notification-delivery.ts` e `/api/cron/patient-messages` já usam esse fornecedor. Alternativa: Meta Cloud API direta, que exigirá outro adapter. Serve para solicitação, confirmação e lembrete, respeitando preferências do paciente. `accepted` significa aceitação pelo provedor, não entrega. Implementar recebimento autenticado/idempotente de eventos de entrega, falha e rejeição; o Resend diferencia `email.sent`, `email.delivered`, `email.failed` e `email.bounced` na [documentação de eventos](https://resend.com/docs/webhooks/event-types). Entrega ao servidor do destinatário não prova leitura.

**Conta/requisitos:** conta Twilio, Sandbox para testes com números autorizados; produção exige remetente WhatsApp, número elegível e processo empresarial Meta/Twilio. Separar telefone, identidade do responsável, dados da empresa, site/termos/privacidade conforme verificação solicitada. Modelos em português precisam aprovação; prazo não garantido.

**Custo:** [Twilio](https://www.twilio.com/en-us/whatsapp/pricing) US$ 0,005 por mensagem recebida/enviada + tarifa Meta aplicável; número pode ter cobrança. Tarifa utilitária brasileira depende da tabela vigente; não foi fixada no orçamento. **Secrets:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_TEMPLATE_REQUESTED`, `TWILIO_TEMPLATE_CONFIRMED`, `TWILIO_TEMPLATE_REMINDER`. **Painel:** remetente, Content Template Builder, modelos com `{{1}}` data/hora e `{{2}}` URL, aprovação e SID de cada modelo. Passos detalhados no guia anterior.

**Cron:** não foi encontrado `vercel.json` versionado com agendamento e não houve inspeção do painel/agendador; confirmar o que foi configurado antes de criar outro cron. `CRON_SECRET`, GET `/api/cron/patient-messages` a cada cinco minutos; revisar mensagens antigas antes de ativar. Remover/ajustar cron antigo para não duplicar lembretes. Vercel Hobby não atende essa frequência; usar plano/agendador compatível. **Webhook:** entrega Twilio ainda pendente; URL proposta `/api/webhooks/twilio` não operacional. Precisa validar assinatura Twilio e URL exata, persistir status e tratar falhas. Sem credenciais, worker e templates podem ser testados com fixtures; bloqueados envio real, aprovação e prova de entrega.

**SMS — prioridade 4:** útil como canal alternativo ou OTP, mas e-mail e autenticação já cobrem o primeiro piloto. Twilio é alternativa compatível de fornecedor; cobrança por destino/segmento, consultar proposta. Não há adapter SMS ou chave específica consumida. Se adotado, definir remetente, templates e callback de entrega; `TWILIO_SMS_FROM` seria futura configuração, não ativa. Não contratar antes de definir o uso.

## 5. Banco, imagens, documentos, backups e segurança

**Prioridade 2.** Manter Supabase Postgres/Storage em vez de duplicar infraestrutura. `patient-avatars` privado; `doctor-photos` público para apresentação profissional; foto médica obrigatória para novos agendamentos. Imagens são reduzidas/reprocessadas no upload web. Fotos públicas não podem conter documento pessoal ou dados clínicos. Buckets clínicos devem permanecer privados; URLs temporárias e autorização no servidor são necessárias para PDFs assinados.

**Conta/custos:** organização Supabase com responsáveis, MFA e cobrança. [Pro](https://supabase.com/pricing) a partir de US$ 25/mês, além de excedentes/compute aplicáveis. Alternativa de objetos/backup: S3 com criptografia e retenção contratada; mudança de banco não é necessária agora. Homologação deve usar projeto separado e dados fictícios.

**Painel/env:** revisar região, backups, limites, RLS, buckets, tamanho/MIME; `SUPABASE_SERVICE_ROLE_KEY` nunca mobile/browser. Não há webhook/redirect próprio para Storage. Para backup externo, credenciais exclusivas e com escopo mínimo no sistema de backup, não na interface. **Atenção:** [backup do banco não inclui os bytes dos arquivos do Storage](https://supabase.com/docs/guides/platform/backups). Pro mantém janela de backups diários; precisa plano separado de cópia/restauração dos objetos e teste de recuperação. PITR é adicional pago; avaliar RPO/RTO antes de contratar.

**Já feito:** migrations aditivas, guards, RLS e testes negativos locais. **Ainda falta:** auditoria abrangente das políticas legadas no banco real, imutabilidade/retencão dos PDFs definitivos, trilha completa de alteração clínica/financeira, cópia de objetos, ensaio de restauração e resposta a incidente. Isso exige configuração/operação além de chaves. Auditoria nova de leitura do histórico não equivale a auditoria completa do prontuário.

## 6. IA de resumos clínicos

**Prioridade 4 para o primeiro piloto de agendamento; prioridade 2 se IA entrar no escopo contratado do piloto.** Recomendado manter OpenAI, já usada opcionalmente na descoberta. Alternativa empresarial: Azure OpenAI, após avaliar contrato, residência/região e compatibilidade; não é troca de URL garantida.

**Código:** `clinical-summary-provider.ts`, `/api/cron/clinical-summaries`, `clinical_summary_jobs`, `clinical_ai_summaries`, autorização temporária ao histórico e revisão pelo médico. A conclusão da consulta enfileira a geração; mudanças posteriores nos registros pedem nova versão. A IA lê campos selecionados de notas, documentos e receitas legadas; não recebe deliberadamente CPF/nome, mas texto livre pode conter identificadores. Não modifica originais. Notas privadas do médico não entram no resumo ou no compartilhamento; a coluna foi restringida no banco. Paciente e médico autorizado veem apenas resumos revisados. Sem consentimento, o worker não gera.

**Conta/requisitos:** projeto na API OpenAI com faturamento, responsáveis e contrato de tratamento compatível com dados de saúde; avaliação de transferência/retencão e base legal com o responsável LGPD. Usar dados fictícios nos testes. **Env:** `CLINICAL_AI_ENABLED=false` por padrão; `OPENAI_API_KEY`, `OPENAI_CLINICAL_MODEL`. Pode usar modelo compatível com Responses + Structured Outputs, após avaliação clínica de qualidade/custo. O guia anterior estima GPT-4.1 mini; não confundir orçamento de busca curta com prontuário inteiro.

**Painel/URL:** configurar limites, projeto e chave de servidor. Cron autenticado GET `https://DOMINIO/api/cron/clinical-summaries`; nenhuma URL de callback é necessária, pois a chamada atual é síncrona. `CRON_SECRET` igual ao agendador. Começar com baixa frequência/volume; processa um job por chamada. **Não ativar antes da aprovação de tratamento de dados e da revisão clínica.** `store:false` não equivale a Zero Data Retention; controles ZDR/MAM têm requisitos próprios. [Controles de dados OpenAI](https://developers.openai.com/api/docs/guides/your-data), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

**Preparado sem chave:** adapter, filas, separação de origem, revisão e testes simulados. **Bloqueado:** qualidade real de resumo, avaliação de omissões/negações, contrato e processamento real. Falhas ficam registradas como `failed`; jobs presos em `processing` precisam investigação operacional, não reenvio cego. Ainda não existe painel operacional completo para isso.

## 7. Endereço, mapas, descoberta e agenda

**Endereço/matching — prioridade 2.** ViaCEP para CEP, geocodificação Nominatim/OpenStreetMap e GPS já existentes; backend usa coordenadas e disponibilidade do paciente, não IA para inventar agenda. Corrigir endereço deve invalidar coordenadas antigas. CEP não prova o número do imóvel, GPS exige conferência e Nominatim público tem [restrições de uso](https://operations.osmfoundation.org/policies/nominatim/). Homologar capacidade/limites e cache antes do piloto. Recomendação se necessário: provedor comercial de geocodificação com contrato/SLA; alternativas Google Geocoding e serviço Nominatim hospedado. A correção local de 29/09 acrescenta conferência do ponto, controle de precisão do GPS e preservação de coordenadas; ainda falta validar os endereços dos participantes. Sem chave no fluxo atual; eventual `GEOCODING_API_KEY` exigirá adapter ainda não implementado. Não há webhook/redirect.

**Maps/Places — prioridade 4.** Google Places (New) preenche contatos externos em `/api/discovery`; não integra o profissional à agenda. A agenda pessoal de contatos manuais não copia resultados do Google para armazenamento permanente. Criar projeto Google Cloud, habilitar faturamento/Places, cotas e restrição de API da chave de servidor `GOOGLE_PLACES_API_KEY`. API usa telefone/site, portanto [Text Search Enterprise](https://developers.google.com/maps/billing-and-pricing/pricing): franquia e preço dependem do SKU; guia anterior usa 1.000 eventos/mês gratuitos e US$ 35/1.000 na primeira faixa paga. Não há sandbox gratuito ilimitado, webhook ou redirect. Não precisa credencial para [links de trajeto Google Maps](https://developers.google.com/maps/documentation/urls/get-started), Waze/Apple Maps já usados. Testes de lugares reais e custos dependem da chave.

**IA de busca — prioridade 4.** `OPENAI_SEARCH_MODEL` e chave OpenAI; opt-in para interpretar especialidade explícita, dados externos vêm do Places e agenda vem do banco. Pode ativar sem IA clínica, com limites separados. Não tem webhook. Custo por tokens, conforme modelo; não diagnostica sintomas. Não impede a busca principal se desligada.

**Agenda externa — prioridade 4.** Hoje a agenda está no Supabase, com exclusão de horários ocupados e bloqueio de concorrência; nenhum Google Calendar é necessário. Sincronizar Google/Outlook posteriormente exige contas de desenvolvedor, OAuth `CLIENT_ID`/`CLIENT_SECRET`, escopos mínimos, redirect e assinatura/renovação de notificações. Não há essas rotas/credenciais no código; projetar ida/volta e resolução de conflitos antes de cadastrá-las. Não enviar informações clínicas em títulos públicos de calendário.

## 8. CRM, identidade e planos de saúde

**CRM/identidade — prioridade 1, ⚠️ PROVIDENCIAR IMEDIATAMENTE.** Nome/CRM/foto preenchidos pelo usuário não comprovam identidade. Recomendo consulta oficial CFM + conferência do titular do certificado e revisão do cadastro profissional. Alternativas de KYC comercial devem ser avaliadas por contrato/necessidade; CPF válido não é identidade comprovada.

**Passos:** solicitar serviço empresarial no CFM, receber requisitos/contrato/chave e documentação atual. [CFM informa consulta por CRM/UF e chave concedida após adesão](https://crmvirtual.cfm.org.br/BR/servico/web-service---listagem-de-medicos). Custo e sandbox: não confirmados, solicitar. Dados empresariais e responsável são parte do cadastro; CRM/UF e identidade do médico entram na homologação. `CFM_API_KEY` é nome proposto, **ainda não consumido**; não inventar endpoint/webhook. Precisa implementar adapter, auditoria e bloqueio de publicação/agendamento por status verificado. Essa validação oficial ainda não existe no produto; verificação manual documentada dos participantes é necessária para um piloto acompanhado.

**Planos — prioridade 2 para catálogo validado; API de elegibilidade pode esperar.** `health_plans`, `clinic_health_plans`, `doctor_health_plans` e a nova regra comparam **ID de plano**, não semelhança de nomes. “Outro” exige confirmação. Catálogo inicial documentado em `20260917050000_health_plan_catalog.sql`: categorias Porto/Hapvida e variantes documentadas de Amil/Bradesco/SulAmérica; referências antigas/regionalizadas estão identificadas. Não é catálogo completo de produtos comercializados. Unimed depende da cooperativa. A clínica precisa cadastrar os planos exatos que aceita; fotografia da carteirinha/registro ANS pode orientar conferência com acesso adequado, não deve virar dado público.

**Não confundir matching com elegibilidade:** paciente ativo, carência, autorização e cobertura contratual exigem consulta à operadora. Recomendo primeiro conferência operacional pela clínica; posteriormente conectores TISS/operadoras ou integrador contratado. Credenciais, certificado, endpoints, sandbox, custo e homologação variam por operadora/prestador; não existe chave ANS universal que confirme todos os planos. [Padrão TISS oficial](https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss). Sem conta externa, catálogo/matching funcionam; autorização de procedimento/faturamento TISS **não estão implementados**.

## 9. Mobile, push e lojas

**Prioridade 3; ⚠️ abrir contas cedo se lançamento incluir lojas.** Expo/React Native usa o mesmo Supabase, e a busca principal por disponibilidade já foi incorporada ao código nativo. App compilado/exportado não significa APK/IPA assinado ou publicação. Recomendação Expo EAS + Expo Push; alternativas FCM/APNs diretamente. [Expo Push não cobra pelo envio](https://docs.expo.dev/push-notifications/faq/), mas builds/contas/infraestrutura têm custos. Referências: Apple Developer US$ 99/ano, Google Play US$ 25 uma vez; Expo plano gratuito com limites e planos pagos conforme uso. Confirmar cobrança local no cadastro.

**Conta/documentos:** Expo, Google Play, Apple Developer; titular legal, identidade e verificação empresarial conforme tipo de conta; organização pode exigir D-U-N-S/verificações próprias. Não prometer prazo de aprovação. Necessários domínio/política de privacidade, suporte, screenshots reais, declarações de dados e exclusão de conta implementada. **Pendências de código:** push, tokens por dispositivo, recibos/remoção de tokens inválidos, deep links, exclusão de conta e requisitos finais das lojas.

**Configuração:** variáveis atuais `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; nenhum segredo no bundle. Para push, adicionar futuramente projeto Expo/EAS, credencial FCM v1 e chave APNs pelo EAS, permissão em aparelho real, `expo-notifications` e worker. Credenciais APNs/Google service account ficam no gerenciador de credenciais, não no chat. Webhook próprio não obrigatório com Expo Push; o worker deverá consultar recibos. [Setup oficial](https://docs.expo.dev/push-notifications/push-notifications-setup/). Não há push operacional hoje.

## 10. Monitoramento, logs, auditoria, analytics e LGPD

**Observabilidade — prioridade 2.** Recomendo Sentry para erros e alertas, mantendo logs técnicos Vercel/Supabase; alternativa OpenTelemetry + serviço contratado. [Sentry tem plano gratuito e planos por volume/recursos](https://sentry.io/pricing/); pedir dimensionamento, não prometer custo fixo. Criar organização/projetos web e mobile, responsáveis e ambientes. Futuras configurações `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` dependem da instalação do SDK e não são consumidas agora. Sem webhook de negócio obrigatório; release upload exige token no CI. **Não ativar gravação de sessão, corpos de requisição, notas, CPF ou conteúdo de documentos.** Precisa filtro de dados, alertas de fila, falha de assinatura, entrega e pagamento. Hoje não há SDK Sentry integrado.

**Auditoria — prioridade 2:** não precisa obrigatoriamente um SaaS novo. A trilha de acessos ao histórico está no banco, mas faltam trilha abrangente de alterações, ações administrativas, exportação/retencão e consulta operacional. Sem credenciais posso implementar eventos sem conteúdo clínico; operação requer responsáveis, retenção e alertas. Logs de infraestrutura sozinhos não cumprem essa função.

**Analytics — prioridade 4:** adiar marketing; medir inicialmente erros e conclusão dos fluxos sem identificar pacientes. Plausible/PostHog são alternativas a avaliar, não instaladas. Conta/custo/cookies/consentimento dependem do serviço e finalidade. Não usar ferramentas de replay em prontuário. Não há chave/webhook/redirect ativo.

**LGPD — prioridade 1, não é uma API.** Definir papéis de controlador/operador, base legal para dados sensíveis, finalidade e compartilhamento entre profissionais, retenção de prontuário, canal do titular, tratamento de menores, contratos com clínicas/fornecedores e resposta a incidentes. Definir encarregado/canal e avaliar juridicamente eventual regime aplicável, sem presumir isenção por empresa pequena. [Orientações ANPD ao titular](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados). Consentimento na tela não resolve sozinho essas obrigações. Dependem de Pedro/responsáveis: política de privacidade, termos, contratos, contato público e aprovação do uso de IA clínica. Dependem de código: acesso mínimo, trilhas, exportação/exclusão conforme retenção, gestão de incidentes e testes. Consultoria tem preço sob proposta; não exige API key/webhook.

**Telemedicina — prioridade 4:** não há sala de vídeo integrada. Se entrar no escopo, definir consentimento e atendimento, regras aplicáveis, fornecedor de salas (por exemplo Daily ou Twilio Video), tokens curtos no servidor, métricas e contrato de dados. Não contratar agora nem anunciar como entregue.

## Roadmap prático

As janelas abaixo indicam ordem de trabalho, não datas garantidas de homologação. As frentes administrativas podem avançar em paralelo; a disponibilidade real dos fornecedores define parte do prazo.

### Fazer hoje

- Definir com Pedro a região, as especialidades e os participantes do piloto; levantar quem manterá a agenda e responderá às solicitações.
- Preparar a revisão/publicação das correções locais, sem realizar push/deploy/SQL até autorização. Conferir a migration de estabilização pelo guia; não reaplicar pacotes antigos.
- **⚠️ PROVIDENCIAR IMEDIATAMENTE:** solicitar homologação/documentação/proposta ICP e abrir sandbox Asaas, explicando consultas médicas, recebedores e comissão zero.
- **⚠️ PROVIDENCIAR IMEDIATAMENTE:** iniciar ou confirmar formalização com contador, CNPJ/conta empresarial e contratos com participantes. Não há confirmação de conclusão desses itens.
- Registrar responsável por suporte em contato@medinexus.com.br. Domínio, Resend, redirects e templates já foram informados como concluídos; não refazer a configuração.

### Fazer esta semana

- Homologar disponibilidade, localização, planos e reserva concorrente com contas separadas e dados de teste; depois, publicar quando autorizado e repetir os cenários no ambiente correto.
- Completar o cadastro dos profissionais reais do piloto: agenda, foto, endereço, valores e planos; conferir CRM/identidade e desenhar aprovação no backend.
- Fechar operação da clínica: confirmação, remarcação, cancelamento, ausência, conclusão e prazo de resposta.
- Conferir cron/filas de consultas já existentes antes de ativar outro; implementar callbacks Resend e acompanhamento de falhas. Os templates do Supabase não personalizam automaticamente o texto enviado pelo worker de consultas.
- Implementar observabilidade com remoção de dados sensíveis, organizar suporte/admin restrito e testar restauração de banco e objetos.
- Preparar termos, privacidade, retenção, consentimentos e contratos com responsáveis; definir tratamento de menores/dependentes e avaliações de pacientes.
- **⚠️ Se WhatsApp for parte do piloto:** abrir verificação de remetente e aprovação de templates desde já; usar apenas números autorizados nos testes.

### Fazer nas próximas semanas

- Executar piloto pequeno acompanhado, medir conversão/tempo de resposta/falhas e corrigir semanalmente; ampliar apenas quando os critérios de liberação estiverem cumpridos.
- Integrar ICP real e validar emissão/entrega do PDF original. Tratar receitas controladas como escopo separado a confirmar com as fontes oficiais.
- Concluir produção financeira, recebedores/repasse, estorno/chargeback e reconciliação antes de habilitar PIX/cartão reais; sandbox aprovado não basta.
- Expandir agenda com exceções onde necessário, diagnóstico dos resultados vazios, aprovação/admin e auditoria operacional.
- Se lojas forem necessárias para a próxima fase, abrir contas Expo/Apple/Google, concluir requisitos de conta e testar em Android/iPhone físicos antes dos builds de produção.

### Pode esperar pelo resultado do piloto

- IA clínica: avaliar depois da jornada principal confiável, com consentimento, contrato e revisão médica; antecipar somente se incluída explicitamente no piloto.
- Places/IA de especialidades, SMS, sincronização com calendários e analytics de marketing.
- Telemedicina, novas regiões/fusos, aplicativo nativo completo e push se o piloto aprovado for web.
- Comissão e pacotes pagos até nova decisão comercial; pacientes continuam gratuitos.
- Integração TISS/elegibilidade automática multioperadora, mantendo conferência operacional pela clínica.

## Coisas que Pedro precisa providenciar

- [x] Domínio registrado na Vercel, DNS web/HTTPS conferidos e e-mail institucional informado.
- [ ] Registrar titulares/responsáveis e atendimento do e-mail institucional; configuração e testes dos cinco passos já foram confirmados por Pedro.
- [ ] Contador, definição empresarial/CNPJ e conta apropriada para operação.
- [ ] Propostas ICP, credenciais de homologação e documentação do fornecedor escolhido.
- [ ] Médico de homologação com CRM/UF e certificado compatível; documentos enviados pelo canal seguro do fornecedor.
- [ ] Sandbox Asaas; resposta sobre marketplace, recebedores, taxas de terceiros e contrato.
- [ ] Contratos com clínicas/médicos, valor da consulta e política de cancelamento/reembolso.
- [x] Configurar Resend SMTP no Supabase (informado por Pedro).
- [x] Conferir status Verified, redirects e entrega de cadastro/recuperação; configurar API dos avisos de consulta (cinco passos concluídos segundo Pedro).
- [x] Personalizar os modelos de e-mail no Supabase (informado por Pedro).
- [ ] Remetente WhatsApp/empresa/modelos se adotados.
- [ ] Lista validada de operadoras/planos aceitos por cada clínica, com identificação específica da variante.
- [ ] Responsável LGPD, política/termos, canal dos titulares e revisão dos contratos de dados.
- [ ] Confirmar ambiente de homologação isolado, responsáveis por alertas/incidentes e objetivos de backup/restauração de banco e arquivos.
- [ ] Definir clínicas/médicos participantes, região/especialidades, responsável pela agenda e prazo de resposta ao paciente.
- [ ] Autorizar a publicação/migration somente após revisão e homologação; nada foi aplicado por esta revisão de roadmap.
- [ ] Antes de incluir IA clínica: aprovar tratamento de dados, avaliação médica, modelo e limites de custo; não é pendência para o piloto recomendado apenas de agendamento.
- [ ] Contas Expo/Apple/Google e informações para as lojas quando chegar essa fase.

**Não basta fornecer todas as chaves para estar pronto para produção.** Checkout sandbox está implementado; liquidação real/repasse, certificação criptográfica, verificação profissional oficial, callbacks de mensagens, auditoria abrangente, push e requisitos das lojas ainda têm trabalho específico. Nenhum deles deve aparecer como concluído apenas por existir uma variável de ambiente.

## Próxima sprint recomendada

**Confiabilidade do agendamento e operação do piloto:** fechar publicação controlada das correções, validar origem/raio e agendas dos participantes, melhorar diagnóstico de busca vazia, ligar verificação profissional à elegibilidade e completar o acompanhamento das mensagens. Cada entrega termina em teste com papéis separados e cenário concreto. ICP/Asaas seguem em homologação paralela, sem ativar emissão ou cobrança reais antes de prontos.
