# MediNexus — ativação dos serviços e custos

> **Atualização de 18/09:** consulte [ROADMAP_INTEGRACOES.md](ROADMAP_INTEGRACOES.md) para as prioridades e integrações novas e [EVOLUCAO_PRODUCAO.md](EVOLUCAO_PRODUCAO.md) para a aplicação dos pacotes SQL de 17/09 e 18/09. As seções abaixo registram a entrega anterior; a atualização funcional nova exige SQL adicional. Checkout Asaas apenas sandbox e resumos clínicos desligados por padrão.

Atualizado em **17/09/2026**. Valores de referência em **dólares americanos**, antes de impostos, câmbio do cartão e excedentes. Nenhum serviço foi contratado ou ativado automaticamente.

## 1. Situação do SQL e da entrega

O retorno **“Success. No rows returned”** é o esperado para o pacote que cria tabelas, funções e permissões. Após sua execução, a conferência pela API encontrou as cinco tabelas novas, os sete RPCs verificados, os campos de certificação e os campos de endereço do médico. **Não execute novamente `ATUALIZACAO_20260916.sql` nesse mesmo banco.** Não há novo SQL para a atualização visual.

A conferência confirma a presença das estruturas; não substitui testar permissões e consultas com contas reais. A versão web com as mudanças visuais e o código dos novos serviços foi publicada em **17/09/2026** em https://medinexus-web.vercel.app. A publicação não ativa automaticamente WhatsApp, IA ou assinatura certificada: os serviços continuam dependendo de configuração e homologação.

### Decisão comercial atual — comissão desativada

Por decisão de Pedro em 17/09, a MediNexus **não cobrará comissão nesta fase**. As taxas anteriormente discutidas (15%, 10% e 7%–8%) ficam guardadas somente como configuração futura; nenhuma delas está ativa. O cálculo padrão retorna zero, e a migration nova `20260917010000_commercial_terms.sql` inicia `platform_commercial_policy.commission_enabled=false`, sem permissão de alteração por pacientes, médicos ou clínicas. Isso não elimina tarifas cobradas por fornecedores externos.

Em **18/09**, a estrutura comercial foi conferida no banco remoto, com `commission_enabled=false`, e a versão web foi publicada. Essa migration integra o pacote de 17/09, não o pacote de 16/09; não reaplique o pacote já presente. Cotações derivam preço e contrato do banco, mantêm o valor registrado e distinguem dinheiro a receber de pagamento confirmado. PIX/cartão, repasse, estorno e conciliação em produção ainda dependem da integração completa. Mensalidades não foram definidas nem ativadas. Pacientes continuam com acesso integral gratuito.

## 2. Quanto custa

| Serviço | Referência de preço | Aplicação na MediNexus |
| --- | --- | --- |
| [Resend](https://resend.com/pricing) | Grátis: 3.000 e-mails/mês, máximo 100/dia. Pro: **US$ 20/mês**, 50.000 e-mails | Solicitação, confirmação e lembrete; autenticação usa configuração SMTP separada |
| [Twilio WhatsApp](https://www.twilio.com/en-us/whatsapp/pricing) | **US$ 0,005 por mensagem recebida ou enviada + tarifa Meta** | Não existe mensalidade única que cubra todos os envios; número e outros serviços podem ter custos adicionais |
| [Google Places Text Search Enterprise](https://developers.google.com/maps/billing-and-pricing/pricing) | 1.000 eventos gratuitos/mês por SKU; depois **US$ 35/1.000**, na primeira faixa paga | O código pede telefone e site, campos da categoria Enterprise; não usar o preço menor do Pro para estimar essa integração |
| [OpenAI GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) | **US$ 0,40/1 milhão de tokens de entrada; US$ 1,60/1 milhão de saída** | Modelo compatível para interpretar especialidades explícitas; uso da API é cobrado à parte |
| [Supabase Pro](https://supabase.com/pricing) | A partir de **US$ 25/mês** | Referência para um projeto pequeno, considerando o crédito de compute; projetos adicionais e excedentes alteram o total |
| [Vercel Pro](https://vercel.com/pricing) | **US$ 20/mês** na base com um assento de desenvolvedor, mais excedentes | Permite cron frequente; o Hobby só permite cron diário, inadequado ao processamento a cada cinco minutos |
| [Expo EAS](https://docs.expo.dev/billing/plans/) | Plano grátis dentro das cotas; Starter **US$ 19/mês**, com US$ 45 de crédito de builds | Plano pago não é obrigatório para começar os testes; builds além da franquia são cobrados |
| [Google Play Console](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en-AU) | **US$ 25, pagamento único** | Conta para distribuir Android |
| [Apple Developer](https://developer.apple.com/programs/enroll/) | **US$ 99/ano**, ou preço local disponível | Conta para distribuir iPhone e usar TestFlight |
| [Certificado do CFM](https://certificadodigital.cfm.org.br/) | Gratuito para médicos que atendem aos requisitos do programa | Certificado do médico; não inclui a integração de assinatura dentro da MediNexus |
| Serviço de assinatura ICP-Brasil/PAdES | **Sob consulta** | Cotar API, autenticação do médico, assinatura, validação e armazenamento. Ainda há desenvolvimento a fazer |

O valor Meta específico de modelos utilitários para números brasileiros **não foi confirmado nesta consulta**. Consulte a tabela vigente no painel do Twilio antes de contratar; categoria, país, janela de atendimento e volume podem alterar a cobrança. Não use a tarifa de chamadas por minuto como preço de mensagem.

### Exemplo para planejar o orçamento

Hipótese: 1.000 consultas/mês, três mensagens WhatsApp por consulta (solicitação, confirmação e lembrete), três e-mails por consulta, 1.000 buscas externas e 1.000 interpretações de IA. Na prática, consentimento, cancelamentos e remarcações alteram a quantidade.

- Vercel Pro + Supabase Pro: **US$ 45/mês**, antes de excedentes.
- Resend Pro: **US$ 20/mês**. A quantidade do exemplo cabe no gratuito, mas concentrar mais de 100 envios num dia ultrapassa sua cota diária.
- Twilio: 3.000 × US$ 0,005 = **US$ 15 + tarifas Meta**, sem contar respostas recebidas ou custo de número.
- Places: **US$ 0** se forem exatamente 1.000 chamadas Enterprise elegíveis à franquia, sem outros consumos desse SKU. Com 2.000 chamadas: aproximadamente **US$ 35**.
- IA: supondo 2.000 tokens de entrada e 200 de saída por busca, **US$ 1,12** para 1.000 buscas. É uma simulação; o catálogo enviado influencia o consumo real.

**Subtotal ilustrativo: US$ 81,12/mês + Meta**, usando Resend Pro e sem Expo pago. Ficam fora domínio, número telefônico, certificação, outros projetos, excedentes e trabalho de desenvolvimento. Apple e Google são despesas separadas: US$ 99/ano e US$ 25 uma vez. Não é uma cotação fechada.

## 3. Ordem recomendada para ativar

### Prioridade prática para começar

1. **Domínio e Resend:** configure primeiro o remetente verificado e o SMTP do Supabase para confirmação de cadastro. Depois valide os avisos de consulta por e-mail. É a primeira integração recomendada para colocar usuários reais no fluxo.
2. **Twilio/WhatsApp e processamento da fila:** com o agendamento validado, aprove os três modelos e configure os lembretes. Teste entrega e consentimento antes de ativar o cron para todos.
3. **Assinatura certificada:** inicie a cotação do provedor em paralelo às mensagens. Esta integração bloqueia a emissão oficial de novos documentos e tem prioridade sobre IA se médicos forem usar a plataforma para atendimento real.
4. **Google Places:** ative quando quiser ampliar a descoberta para profissionais que ainda não estão cadastrados. O trajeto das consultas já usa links de mapas e não depende dessa contratação.
5. **IA da busca:** acrescente depois que a busca convencional e os contatos estiverem funcionando; é uma melhoria de interpretação, não um requisito para marcar consultas.
6. **Lojas Android/iPhone:** prepare as contas e a documentação em paralelo, mas publique depois dos testes em aparelhos e da homologação das integrações essenciais.

Na conferência da Vercel em 17/09/2026, as variáveis de conexão com Supabase, URL do app e segredo do cron já estavam cadastradas em produção. As variáveis de Resend, Twilio, Places e OpenAI ainda não apareciam na configuração. Presença de um segredo de cron não significa que há um agendamento ativo.

### Etapa A — hospedagem e endereço oficial

1. Defina o domínio oficial e o ambiente de homologação. Confira o projeto da Vercel e o Supabase aos quais cada ambiente aponta.
2. Em **Vercel → projeto → Settings → Environment Variables**, cadastre os nomes de `.env.example`. Marque o ambiente correspondente, sem publicar segredos em variáveis `NEXT_PUBLIC_*`.
3. Configure `NEXT_PUBLIC_APP_URL` com a URL HTTPS oficial, sem barra final. As outras variáveis públicas são `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Guarde `SUPABASE_SERVICE_ROLE_KEY` somente no servidor. Não copie para o aplicativo móvel.
5. Publique a versão web atualizada e teste login, papéis, cadastro, busca, consulta e perfil antes de ativar envios. Alterar variáveis na Vercel exige uma nova implantação para que a aplicação use os valores novos.

### Etapa B — e-mails pelo Resend

1. Crie a conta em [Resend](https://resend.com/) e cadastre seu domínio em **Domains**.
2. No provedor de DNS do domínio, copie exatamente os registros solicitados pelo Resend. Aguarde o domínio ficar verificado. [Guia oficial](https://resend.com/docs/dashboard/domains/introduction).
3. Crie uma API key de envio e adicione na hospedagem: `RESEND_API_KEY` e `RESEND_FROM_EMAIL`, por exemplo `MediNexus <avisos@seu-dominio.com.br>`, usando seu domínio real.
4. Para confirmação de cadastro/recuperação de senha, configure também **Supabase → Authentication → SMTP Settings**, com os dados SMTP do Resend. Esse envio é independente dos avisos de consulta. Confira **URL Configuration** e permita a URL de retorno de login da versão publicada. [Integração SMTP oficial](https://resend.com/docs/send-with-supabase-smtp).
5. Na conta de teste do paciente, complete o contato e habilite o recebimento de e-mail em seu perfil.
6. Depois de habilitar o processamento da Etapa D, solicite e confirme uma consulta de teste. Confira a caixa de entrada e os logs do Resend. Não valide apenas pelo registro `accepted` no banco.

### Etapa C — WhatsApp Business pelo Twilio

1. Crie uma conta em [Twilio](https://www.twilio.com/) e use inicialmente o Sandbox com um número de teste autorizado. Produção exige cadastrar seu remetente WhatsApp e concluir as verificações indicadas pelo Twilio/Meta.
2. Cadastre a empresa e o número pelo fluxo de **WhatsApp Senders**. Confira com o fornecedor os requisitos do número e eventual migração antes de usar o WhatsApp que você já atende hoje.
3. Crie três modelos no **Content Template Builder**, em português do Brasil, e solicite aprovação para o uso transacional. O provedor decide a categoria final. [Guia de modelos](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates).
4. Os textos precisam ser compatíveis com as variáveis do código: `{{1}}` recebe a data/hora; `{{2}}` recebe a URL completa de consultas. Use modelos de texto com essas duas variáveis. Exemplos para adaptar e submeter:

   - Solicitação: “Recebemos sua solicitação para {{1}}. Aguarde a confirmação do atendimento. Acompanhe em {{2}}.”
   - Confirmação: “Sua consulta para {{1}} foi confirmada. Confira os detalhes em {{2}}.”
   - Lembrete: “Lembrete da sua consulta confirmada para {{1}}. Confira os detalhes e sua presença em {{2}}.”

5. Cadastre na Vercel `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_WHATSAPP_FROM` no formato `whatsapp:+55DDDNUMERO`.
6. Copie os **Content SIDs** aprovados para `TWILIO_TEMPLATE_REQUESTED`, `TWILIO_TEMPLATE_CONFIRMED` e `TWILIO_TEMPLATE_REMINDER`.
7. Publique novamente, habilite a preferência WhatsApp de um paciente de teste e valide os três eventos. A solicitação inicial não deve ser apresentada como consulta confirmada.

### Etapa D — processamento automático da fila

1. Crie um `CRON_SECRET` aleatório longo no servidor e mantenha-o fora do repositório.
2. Revise qualquer agendamento anterior de `/api/cron/appointment-confirmations`: ele pode duplicar lembretes se permanecer ativo junto ao novo fluxo.
3. Após configurar os provedores e revisar a fila existente, configure uma chamada **GET** a `/api/cron/patient-messages` a cada cinco minutos, com `Authorization: Bearer <CRON_SECRET>`. Nunca coloque o segredo na URL.
4. Na Vercel Pro, o trecho abaixo pode ser integrado ao `vercel.json` da aplicação, preservando outras configurações. O arquivo não foi ativado nesta entrega:

```json
{
  "crons": [
    { "path": "/api/cron/patient-messages", "schedule": "*/5 * * * *" }
  ]
}
```

O cron da Vercel utiliza `CRON_SECRET` para autenticar a chamada. O Hobby limita cron a uma execução por dia; use um plano/agendador compatível com a frequência. [Limites oficiais](https://vercel.com/docs/cron-jobs/usage-and-pricing).

5. No SQL Editor, esta consulta **somente lê** o estado geral da fila:

```sql
select channel, kind, status, count(*) as total
from public.appointment_outbox
group by channel, kind, status
order by channel, kind, status;
```

6. `queued` = aguardando; `processing` = em processamento; `accepted` = aceito pelo provedor; `skipped` = descartado, por exemplo por ausência de consentimento; `failed` = falha; `unknown` = resultado incerto. Não reenvie registros `processing`/`unknown` sem conferir no fornecedor.
7. **Callbacks de entrega ainda precisam ser implementados.** Até lá, a confirmação efetiva de entrega vem dos logs dos provedores. O worker processa até 20 eventos por execução; se o volume crescer, acompanhar a fila e ajustar capacidade/frequência.

As consultas criadas após a atualização podem já ter eventos aguardando. Revisar a fila antes de ligar o cron evita ativar envios inesperados de testes antigos. Documentos/consultas anteriores à migração não recebem eventos retroativos automaticamente.

### Etapa E — contatos externos no Google Maps

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/), vincule faturamento e habilite **Places API (New)**.
2. Crie uma chave para uso pelo servidor, restrita à API necessária. Não use restrição por domínio de navegador em uma chave chamada pelo backend. Restrição por IP requer saída de rede estável/compatível com a hospedagem.
3. Configure cotas e alertas de cobrança. Alertas de orçamento não são um bloqueio automático de consumo.
4. Salve somente no backend: `GOOGLE_PLACES_API_KEY`. Publique a atualização.
5. Na busca, marque “incluir contatos externos” e teste com uma cidade real. Confira telefone/site e a separação entre profissionais cadastrados e externos.

O campo de telefone/site faz a chamada usar o SKU **Text Search Enterprise**. [Campos e categorias](https://developers.google.com/maps/documentation/places/web-service/text-search). Links de trajeto para Google Maps, Waze e Apple Maps já funcionam sem contratar Places; [Google Maps URLs não exige API key](https://developers.google.com/maps/documentation/urls/get-started).

### Etapa F — interpretação da busca com IA

1. Crie um projeto na plataforma de API da OpenAI, configure faturamento e os controles de consumo da conta.
2. Gere uma chave do projeto e salve no backend como `OPENAI_API_KEY`.
3. Configure `OPENAI_SEARCH_MODEL=gpt-4.1-mini` como opção inicial compatível com Responses e Structured Outputs. [Capacidades e preços](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
4. Publique novamente. Faça uma busca de teste com uma especialidade explícita, como “cardiologista”, e marque a opção de IA. Confirme uso no painel da API.
5. A IA interpreta a especialidade; dados de contato externos vêm do Google Places, e horários disponíveis vêm do Supabase. O recurso não faz diagnóstico e não inventa médicos ou agendas.

### Etapa G — assinatura certificada do médico

Esta etapa **exige contratação/definição do fornecedor e desenvolvimento adicional**, não apenas preencher uma chave.

1. Cada médico deve ter seu certificado elegível. Verifique o [programa do CFM](https://certificadodigital.cfm.org.br/), seus requisitos e compatibilidade com o fornecedor escolhido.
2. Solicite uma proposta para API de assinatura **ICP-Brasil em PDF/PAdES**. Exija demonstração com o certificado real do médico, autorização individual, identificação do titular, validação da cadeia e retorno autenticado. A [documentação da Lacuna](https://docs.lacunasoftware.com/en-us/) é uma referência técnica para avaliar; não há contrato ou preço aprovado para a MediNexus.
3. Envie para análise somente o nome do fornecedor e sua documentação técnica. Guarde chaves no ambiente apropriado; não envie senha de certificado no chat.
4. Implementar: PDF imutável, autorização do médico, solicitação de assinatura, callback autenticado, validação de identidade/certificado/hash, armazenamento privado e liberação do PDF original ao paciente.
5. Homologar um documento e sua validação externa antes de liberar emissão oficial. **Até isso ocorrer, documentos novos ficam em rascunho. A imagem da assinatura não é uma certificação.**

### Etapa H — publicar Android e iPhone

1. Crie as contas Expo, Google Play Console e Apple Developer em nome do responsável pelo aplicativo. Complete as verificações solicitadas pelas plataformas.
2. Em `medinexus-mobile`, confira `app.json`: nome, ícones, identificadores `com.medinexus.app` e titularidade. Vincule à conta/projeto Expo com o EAS CLI e configure os ambientes de build.
3. Copie somente `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para o ambiente de build. A URL web precisa apontar para a versão publicada com a API nova.
4. Gere primeiro um APK de teste: `npx eas-cli build --platform android --profile preview`. Para iPhone, prepare credenciais e um build apropriado para aparelhos/TestFlight. O build em nuvem permite trabalhar a partir do Windows.
5. Teste em aparelhos reais: cadastro/confirmação de e-mail, login, perfil/foto, permissões de localização, teclado, busca, reserva, presença, documentos e mapas.
6. Prepare a ficha das lojas: screenshots reais, descrição, suporte, política de privacidade acessível, declarações de dados e fluxo de exclusão de conta. A versão atual ainda precisa concluir os requisitos de publicação, incluindo exclusão de conta; um bundle exportado não resolve isso.
7. Gere builds de produção com `npx eas-cli build --platform android --profile production` e `npx eas-cli build --platform ios --profile production`. Valide no teste interno/fechado do Google Play e TestFlight antes de solicitar distribuição pública.
8. Envie para revisão das lojas. Contas novas podem exigir testes adicionais; siga os requisitos apresentados no seu painel. Taxa paga e build bem-sucedido não garantem aprovação.

## 4. O que ainda depende de trabalho

- Concluir a homologação transacional das integrações com o banco real; a versão web já foi publicada.
- Configurar e testar Resend, Twilio, Places, IA e o agendamento automático; integrar callbacks de entrega.
- Escolher o provedor e implementar a certificação ICP-Brasil de ponta a ponta.
- Concluir requisitos de loja, testar em aparelhos e gerar/publicar os instaladores Android/iOS.
- No app nativo, avaliações, convênios e gestão profissional ainda abrem a web.
- A descoberta atual de cadastrados é baseada nos médicos vinculados a clínicas; consultórios autônomos ainda precisam entrar nessa busca/agendamento.
- Avaliar serviço de geocodificação com capacidade de produção: o código usa ViaCEP/OpenStreetMap e precisa respeitar a [política do Nominatim](https://operations.osmfoundation.org/policies/nominatim/). O custo depende do serviço e volume escolhidos.

Para começar, conclua **domínio/hospedagem e Resend**. Em seguida, **Twilio e fila automática**; depois, **Places e IA**. Cotação da assinatura e abertura das contas das lojas podem ocorrer em paralelo, pois dependem de verificações externas.
