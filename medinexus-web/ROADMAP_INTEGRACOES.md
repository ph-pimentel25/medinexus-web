# MediNexus — integrações, homologação e providências

Revisão: **18/09/2026**. A versão web e as APIs foram publicadas na Vercel nesta data; a presença das novas estruturas foi conferida pela API do Supabase. Isso não ativa nem homologa os fornecedores externos descritos aqui. Consulte [EVOLUCAO_PRODUCAO.md](EVOLUCAO_PRODUCAO.md) para o registro da publicação e seus limites. O guia anterior [GUIA_INTEGRACOES.md](GUIA_INTEGRACOES.md) continua útil para configurar Resend, Twilio, Places e hospedagem. Este relatório atualiza o escopo e as prioridades.

**Decisão comercial vigente:** paciente usa todos os recursos gratuitamente. Comissão MediNexus desativada. Não há cobrança de assinatura profissional ativa. Não definir agora a monetização das consultas. Taxas do processador de pagamento são custos de terceiros e não desaparecem com comissão zero; a responsabilidade por elas deve constar do contrato antes da operação real.

## Começar hoje, Pedro

1. **⚠️ PROVIDENCIAR IMEDIATAMENTE — domínio e formalização.** Você informou que ainda não tem domínio, CNPJ ou conta empresarial. Escolha um domínio e registre-o no seu nome/responsável legal; contrate contador para definir a empresa, atividade e conta bancária apropriadas. Não é necessário esperar a empresa ficar pronta para desenvolver e pedir demonstrações. Para contratos de marketplace, verificação de empresa e repasses, confirme com cada fornecedor os requisitos de pessoa jurídica.
2. **⚠️ PROVIDENCIAR IMEDIATAMENTE — assinatura.** Entre nos canais comerciais de [BRy](https://bry-developer.readme.io/reference/assinatura-com-certificado-na-nuvem), [Soluti](https://idtech.soluti.com.br/portal-de-integracoes) e [Certisign](https://desenvolvedor.certisign.io/docs/guias/assinaturas/). Peça proposta e homologação para **prescrição médica, PDF/PAdES, certificado ICP-Brasil em nuvem e assinatura individual consciente**. Solicite documentação, credenciais de teste, limites de sessão, revogação, autenticação adicional, validação criptográfica e preços por médico/documento. Não basta contratar uma imagem de assinatura ou um certificado sem API compatível.
3. **⚠️ PROVIDENCIAR IMEDIATAMENTE — pagamentos.** Crie uma conta no [Sandbox Asaas](https://sandbox.asaas.com/). Solicite ao atendimento validação do seu cenário: plataforma de consultas, médicos/clínicas recebedores, sem comissão inicial, PIX/cartão, cancelamento, estorno e repasse. Peça requisitos de marketplace/subcontas e documentação de identificação dos recebedores. O sandbox pode avançar antes da produção. [Introdução oficial](https://docs.asaas.com/docs/visao-geral).
4. **Domínio + Resend.** Crie conta no [Resend](https://resend.com/), verifique o domínio por DNS e configure SMTP no Supabase. Sem isso, confirmação de cadastro e recuperação de acesso não ficam homologadas.
5. **⚠️ PROVIDENCIAR IMEDIATAMENTE — profissionais do piloto.** Separe médicos/clínicas participantes, responsável pelo cadastro, CRM/UF, documento de identidade e certificado para homologação. Consulte o [serviço de consulta de médicos do CFM](https://crmvirtual.cfm.org.br/BR/servico/web-service---listagem-de-medicos): o acesso empresarial depende de adesão e chave, não de uma API pública anônima.

Depois, informe no chat **apenas**: domínio escolhido, nome do fornecedor, ambiente sandbox ou produção, número de protocolo e link da documentação recebida. Cadastre chaves diretamente nas variáveis da hospedagem/ambiente de homologação. Não cole segredos, certificados privados, senhas ou documentos pessoais aqui.

## Prioridades ligadas ao código

| Integração / providência | Classificação | Situação no projeto |
| --- | --- | --- |
| ICP-Brasil, PDF assinado, verificação de identidade e emissão médica | **1. CRÍTICA AGORA** | Rascunhos protegidos no banco; contrato de adapter; fornecedor e verificação criptográfica pendentes |
| PIX/cartão e desenho de recebimento/repasse | **1. CRÍTICA AGORA** | Checkout Asaas sandbox e webhook preparados; dinheiro presencial; produção e repasses pendentes |
| Domínio, e-mail transacional, autenticação e recuperação | **1. CRÍTICA AGORA** | Supabase Auth existente; recuperação implementada; Resend/SMTP ainda precisam configuração e entrega real |
| CRM e identidade profissional | **1. CRÍTICA AGORA** | CRM informado no cadastro não equivale a CRM verificado; API/KYC pendentes |
| Contratos, LGPD, responsáveis e tratamento de dados clínicos | **1. CRÍTICA AGORA** | Consentimentos e permissões implementados parcialmente; governança e revisão jurídica pendentes |
| Banco, Storage privado, backups e restauração | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | Supabase existente; buckets e RLS; recuperação operacional não homologada |
| WhatsApp e fila de mensagens | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | Worker/Twilio preparados; remetente/templates/callbacks pendentes |
| IA de resumo clínico | **2. NECESSÁRIA ANTES DO MVP/PILOTO**, se incluída no piloto | Worker, consentimento, revisão médica e histórico separados; desligada |
| Monitoramento, auditoria e alertas | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | Logs básicos e auditoria de leitura do histórico; observabilidade abrangente pendente |
| Endereços e geocodificação para o matching | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | ViaCEP/Nominatim/GPS; precisa homologar qualidade e capacidade de uso |
| Verificação da aceitação de planos | **2. NECESSÁRIA ANTES DO MVP/PILOTO** | Catálogo e matching por ID; manual exige confirmação; não consulta elegibilidade na operadora |
| Publicação Android/iOS, push e exclusão de conta | **3. NECESSÁRIA ANTES DE PRODUÇÃO** | Código Expo; build assinado, lojas, push e exclusão ainda pendentes |
| Busca externa Google Places / IA de especialidades | **4. PODE ESPERAR** | Adapter existente; busca dos cadastrados e matching não dependem deles |
| SMS, Google/Outlook Calendar, analytics de marketing | **4. PODE ESPERAR** | Sem integração; não necessários para o primeiro atendimento presencial |
| Telemedicina/videoconferência | **4. PODE ESPERAR** | Fora do fluxo presencial atual; exige escopo, fornecedor e homologação próprios |
| Assinaturas comerciais e comissão automática | **4. PODE ESPERAR** | Infraestrutura de comissão guardada e desativada; preços não definidos |

“Pode esperar” não significa substituir uma função por simulação: a interface deve informar indisponibilidade quando o fornecedor não estiver ativo.

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

**Recomendação:** manter Supabase Auth e Resend; alternativas de SMTP: SES/Postmark. Código já usa autenticação centralizada, cadastro por papel e `/recuperar-conta`; médico/gestor não ganha acesso só por autodeclarar papel no navegador. Worker de consultas usa Resend por API; e-mail de login/cadastro/recuperação usa **SMTP do Supabase**, separadamente. Não há entrega homologada nesta sessão.

**Custos/conta:** [Resend](https://resend.com/pricing): gratuito 3.000/mês, limite 100/dia; Pro US$ 20/mês/50.000. Criar conta, ter domínio e acesso ao DNS; verificar DKIM/SPF conforme painel. CNPJ pode ser exigido em contratação comercial, não pressuposto para todo teste. Testes iniciais usam destinatários permitidos pelo fornecedor; teste de entrega real exige domínio/remetente válido.

**Variáveis:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`; `SUPABASE_SERVICE_ROLE_KEY` só servidor. `RESEND_API_KEY`, `RESEND_FROM_EMAIL` para mensagens; credenciais SMTP ficam no painel do Supabase. **Painel:** Authentication → SMTP Settings; URL Configuration → Site URL oficial e redirects exatos `/login`, `/recuperar-conta?update=1`, equivalentes de homologação. A recuperação mobile abre a web; não inventar deep link nativo não implementado. [Senhas/recuperação](https://supabase.com/docs/guides/auth/passwords), [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls).

**Sem credenciais:** formulários, estados, validação, fluxos de sessão e worker preparados. **Pendente:** entrega real, limites/antispam, recuperação expirada, revogação de sessões e MFA profissional em homologação. Callbacks de entrega/bounce do Resend ainda não implementados; URL proposta `/api/webhooks/resend` **não deve ser configurada até existir**. SMTP não exige webhook para funcionar.

## 4. WhatsApp, SMS e processamento das mensagens

**WhatsApp — prioridade 2, ⚠️ abrir cadastro agora se for promessa do piloto.** Recomendado Twilio, pois `notification-delivery.ts` e `/api/cron/patient-messages` já usam esse fornecedor. Alternativa: Meta Cloud API direta, que exigirá outro adapter. Serve para solicitação, confirmação e lembrete, respeitando preferências do paciente. `accepted` significa aceitação pelo provedor, não entrega.

**Conta/requisitos:** conta Twilio, Sandbox para testes com números autorizados; produção exige remetente WhatsApp, número elegível e processo empresarial Meta/Twilio. Separar telefone, identidade do responsável, dados da empresa, site/termos/privacidade conforme verificação solicitada. Modelos em português precisam aprovação; prazo não garantido.

**Custo:** [Twilio](https://www.twilio.com/en-us/whatsapp/pricing) US$ 0,005 por mensagem recebida/enviada + tarifa Meta aplicável; número pode ter cobrança. Tarifa utilitária brasileira depende da tabela vigente; não foi fixada no orçamento. **Secrets:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_TEMPLATE_REQUESTED`, `TWILIO_TEMPLATE_CONFIRMED`, `TWILIO_TEMPLATE_REMINDER`. **Painel:** remetente, Content Template Builder, modelos com `{{1}}` data/hora e `{{2}}` URL, aprovação e SID de cada modelo. Passos detalhados no guia anterior.

**Cron:** `CRON_SECRET`, GET `/api/cron/patient-messages` a cada cinco minutos; revisar mensagens antigas antes de ativar. Remover/ajustar cron antigo para não duplicar lembretes. Vercel Hobby não atende essa frequência; usar plano/agendador compatível. **Webhook:** entrega Twilio ainda pendente; URL proposta `/api/webhooks/twilio` não operacional. Precisa validar assinatura Twilio e URL exata, persistir status e tratar falhas. Sem credenciais, worker e templates podem ser testados com fixtures; bloqueados envio real, aprovação e prova de entrega.

**SMS — prioridade 4:** útil como canal alternativo ou OTP, mas e-mail e autenticação já cobrem o primeiro piloto. Twilio é alternativa compatível de fornecedor; cobrança por destino/segmento, consultar proposta. Não há adapter SMS ou chave específica consumida. Se adotado, definir remetente, templates e callback de entrega; `TWILIO_SMS_FROM` seria futura configuração, não ativa. Não contratar antes de definir o uso.

## 5. Banco, imagens, documentos, backups e segurança

**Prioridade 2.** Manter Supabase Postgres/Storage em vez de duplicar infraestrutura. `patient-avatars` privado; `doctor-photos` público para apresentação profissional; foto médica obrigatória para novos agendamentos. Imagens são reduzidas/reprocessadas no upload web. Fotos públicas não podem conter documento pessoal ou dados clínicos. Buckets clínicos devem permanecer privados; URLs temporárias e autorização no servidor são necessárias para PDFs assinados.

**Conta/custos:** organização Supabase com responsáveis, MFA e cobrança. [Pro](https://supabase.com/pricing) a partir de US$ 25/mês, além de excedentes/compute aplicáveis. Alternativa de objetos/backup: S3 com criptografia e retenção contratada; mudança de banco não é necessária agora. Homologação deve usar projeto separado e dados fictícios.

**Painel/env:** revisar região, backups, limites, RLS, buckets, tamanho/MIME; `SUPABASE_SERVICE_ROLE_KEY` nunca mobile/browser. Não há webhook/redirect próprio para Storage. Para backup externo, credenciais exclusivas e com escopo mínimo no sistema de backup, não na interface. **Atenção:** [backup do banco não inclui os bytes dos arquivos do Storage](https://supabase.com/docs/guides/platform/backups). Pro mantém janela de backups diários; precisa plano separado de cópia/restauração dos objetos e teste de recuperação. PITR é adicional pago; avaliar RPO/RTO antes de contratar.

**Já feito:** migrations aditivas, guards, RLS e testes negativos locais. **Ainda falta:** auditoria abrangente das políticas legadas no banco real, imutabilidade/retencão dos PDFs definitivos, trilha completa de alteração clínica/financeira, cópia de objetos, ensaio de restauração e resposta a incidente. Isso exige configuração/operação além de chaves. Auditoria nova de leitura do histórico não equivale a auditoria completa do prontuário.

## 6. IA de resumos clínicos

**Prioridade 2 se o piloto incluir IA; pode ficar desligada para testar os demais fluxos.** Recomendado manter OpenAI, já usada opcionalmente na descoberta. Alternativa empresarial: Azure OpenAI, após avaliar contrato, residência/região e compatibilidade; não é troca de URL garantida.

**Código:** `clinical-summary-provider.ts`, `/api/cron/clinical-summaries`, `clinical_summary_jobs`, `clinical_ai_summaries`, autorização temporária ao histórico e revisão pelo médico. A conclusão da consulta enfileira a geração; mudanças posteriores nos registros pedem nova versão. A IA lê campos selecionados de notas, documentos e receitas legadas; não recebe deliberadamente CPF/nome, mas texto livre pode conter identificadores. Não modifica originais. Notas privadas do médico não entram no resumo ou no compartilhamento; a coluna foi restringida no banco. Paciente e médico autorizado veem apenas resumos revisados. Sem consentimento, o worker não gera.

**Conta/requisitos:** projeto na API OpenAI com faturamento, responsáveis e contrato de tratamento compatível com dados de saúde; avaliação de transferência/retencão e base legal com o responsável LGPD. Usar dados fictícios nos testes. **Env:** `CLINICAL_AI_ENABLED=false` por padrão; `OPENAI_API_KEY`, `OPENAI_CLINICAL_MODEL`. Pode usar modelo compatível com Responses + Structured Outputs, após avaliação clínica de qualidade/custo. O guia anterior estima GPT-4.1 mini; não confundir orçamento de busca curta com prontuário inteiro.

**Painel/URL:** configurar limites, projeto e chave de servidor. Cron autenticado GET `https://DOMINIO/api/cron/clinical-summaries`; nenhuma URL de callback é necessária, pois a chamada atual é síncrona. `CRON_SECRET` igual ao agendador. Começar com baixa frequência/volume; processa um job por chamada. **Não ativar antes da aprovação de tratamento de dados e da revisão clínica.** `store:false` não equivale a Zero Data Retention; controles ZDR/MAM têm requisitos próprios. [Controles de dados OpenAI](https://developers.openai.com/api/docs/guides/your-data), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

**Preparado sem chave:** adapter, filas, separação de origem, revisão e testes simulados. **Bloqueado:** qualidade real de resumo, avaliação de omissões/negações, contrato e processamento real. Falhas ficam registradas como `failed`; jobs presos em `processing` precisam investigação operacional, não reenvio cego. Ainda não existe painel operacional completo para isso.

## 7. Endereço, mapas, descoberta e agenda

**Endereço/matching — prioridade 2.** ViaCEP para CEP, geocodificação Nominatim/OpenStreetMap e GPS já existentes; backend usa coordenadas e disponibilidade do paciente, não IA para inventar agenda. Corrigir endereço deve invalidar coordenadas antigas. CEP não prova o número do imóvel, GPS exige conferência e Nominatim público tem [restrições de uso](https://operations.osmfoundation.org/policies/nominatim/). Homologar capacidade/limites e cache antes do piloto. Recomendação se necessário: provedor comercial de geocodificação com contrato/SLA; alternativas Google Geocoding e serviço Nominatim hospedado. Sem chave no fluxo atual; eventual `GEOCODING_API_KEY` exigirá adapter ainda não implementado. Não há webhook/redirect.

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

### Fazer hoje

- Escolher domínio e responsáveis; iniciar formalização com contador.
- Pedir homologação/proposta de assinatura e requisitos de sessão temporária.
- Abrir sandbox Asaas e apresentar o cenário de marketplace sem comissão.
- Criar Resend, organizar acesso ao DNS e SMTP.
- Definir médicos/clínicas do piloto e como verificar CRM/identidade.

### Fazer esta semana

- Criar homologação isolada, aplicar pacote novo uma única vez e testar permissões com contas de paciente, médico e clínica.
- Homologar cadastro, recuperação de senha, disponibilidade, foto, plano específico e confirmação de “Outro”.
- Executar PIX/cartão fictícios com webhook e dinheiro presencial sem marcar pago.
- Escolher fornecedor ICP e provar assinatura/validação com certificado de teste do médico.
- Solicitar WhatsApp/templates se fizerem parte do piloto; preparar contratos/privacidade com responsável jurídico.
- Configurar backups de banco **e arquivos**, monitoramento de erros/filas e teste de restauração.

### Fazer nas próximas semanas

- Implementar/validar assinatura real e armazenamento do PDF original; verificar requisitos SNCR conforme escopo de receitas.
- Concluir repasses, estornos, chargeback, onboarding e reconciliação antes de receber dinheiro real.
- Avaliar IA clínica com casos fictícios/revisão médica; ativar só com condições contratuais e operacionais aprovadas.
- Homologar aparelhos Android/iOS, impressão real, exclusão de conta, push e submissão às lojas.
- Publicar funcionalidades novas somente após migrations e testes no ambiente correspondente.

### Pode esperar

- Places/IA de especialidades, SMS, calendários externos, analytics de marketing e telemedicina.
- Comissão e pacotes pagos até nova decisão comercial explícita.
- Automação TISS/eligibilidade multiope­radora, mantendo conferência de cobertura pela clínica.

## Coisas que Pedro precisa providenciar

- [ ] Domínio, DNS, e-mail de suporte e titular das contas.
- [ ] Contador, definição empresarial/CNPJ e conta apropriada para operação.
- [ ] Propostas ICP, credenciais de homologação e documentação do fornecedor escolhido.
- [ ] Médico de homologação com CRM/UF e certificado compatível; documentos enviados pelo canal seguro do fornecedor.
- [ ] Sandbox Asaas; resposta sobre marketplace, recebedores, taxas de terceiros e contrato.
- [ ] Contratos com clínicas/médicos, valor da consulta e política de cancelamento/reembolso.
- [ ] Resend/domínio verificado e SMTP; remetente WhatsApp/empresa/modelos se adotados.
- [ ] Lista validada de operadoras/planos aceitos por cada clínica, com identificação específica da variante.
- [ ] Responsável LGPD, política/termos, canal dos titulares e revisão dos contratos de dados.
- [ ] Projeto de homologação, plano de backup/restauração, responsáveis por alertas e incidentes.
- [ ] Decisão contratual sobre IA clínica, modelo e limites de custo; não usar dados reais antes disso.
- [ ] Contas Expo/Apple/Google e informações para as lojas quando chegar essa fase.

**Não basta fornecer todas as chaves para estar pronto para produção.** Checkout sandbox está implementado; liquidação real/repasse, certificação criptográfica, verificação profissional oficial, callbacks de mensagens, auditoria abrangente, push e requisitos das lojas ainda têm trabalho específico. Nenhum deles deve aparecer como concluído apenas por existir uma variável de ambiente.
