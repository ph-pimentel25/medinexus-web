# Atualização MediNexus — setembro de 2026

A versão web desta entrega foi **publicada em 17/09/2026** em https://medinexus-web.vercel.app. O aplicativo nativo ainda não foi publicado nas lojas. Você executou o pacote SQL com sucesso; a conferência posterior pela API encontrou as cinco tabelas novas, os sete RPCs verificados e os campos de certificação/endereço no Supabase configurado. **Não reaplique o pacote nesse banco.** Nenhum WhatsApp/e-mail real foi enviado. Os testes de comportamento das migrações usaram PostgreSQL local em memória com dados fictícios; a presença das estruturas remotas não equivale à homologação completa das permissões.

O [guia de integrações e custos](GUIA_INTEGRACOES.md) explica a ordem de ativação, variáveis, contas, preços consultados e tarefas pendentes.

## Os 12 pedidos

| Pedido | Implementação e limites atuais |
| --- | --- |
| 1. Documento inspirado na referência | Modelo A4 compacto, identificação em quadros, conteúdo em linhas, convênio, endereço, assinatura visual e QR com rota corrigida. Conteúdo longo pode ocupar várias páginas. Nenhum dado pessoal da foto foi copiado. |
| 2. Localização | CEP e GPS, todos os 27 estados, leitura de UF ISO, número quando disponível, endereço da clínica e consultório autônomo. Editar endereço invalida GPS anterior. Endereço desconhecido não vira silenciosamente o centro da cidade. GPS informa margem de precisão; conferir número e complemento continua necessário. |
| 3. Especialidades | Catálogo existente do Supabase, seleção múltipla com filtro no cadastro e perfil do médico. Alteração no perfil usa uma transação no banco. O cadastro de médicos pela clínica já usava o catálogo. |
| 4. Interface | Padronização visual das páginas públicas e áreas de paciente, médico e clínica: paleta original preservada, fonte Inter local, menu lateral desktop, busca de páginas, menu/barras móveis, painéis com métricas reais, cartões, campos, botões, tabelas e estados de interface. O app nativo recebeu a mesma paleta, atalhos e ícones. A referência serviu de inspiração para organização e hierarquia, sem reprodução exata. |
| 5. Android e iPhone | Projeto Expo/React Native separado em `../medinexus-mobile`. Cadastro de paciente, login, sessão protegida, foto/edição do perfil, CEP/GPS, preferências de avisos, consultas, confirmação de presença, busca convencional/IA/contatos externos, agenda particular, documentos e mapas nativos. Avaliações, convênios e cadastro/gestão profissional ainda usam o site. Pacotes JavaScript validados; não há APK/IPA de produção nem publicação nas lojas. |
| 6. WhatsApp e e-mail | Fila transacional para solicitação recebida, consulta confirmada e lembrete 24h antes; preferências do paciente; adaptadores Twilio e Resend; processamento via cron. Depende de contas, remetentes/modelos aprovados, chaves e agendamento do worker. |
| 7. IA e médicos externos | `/descobrir` e API autenticada. IA opcional interpreta uma especialidade explícita; contatos vêm do Google Places. Profissionais cadastrados permitem consultar horários; externos permitem telefone/site/mapas. Sem chaves, busca cadastrada continua disponível, com aviso real sobre serviços ausentes. Não há diagnóstico por IA. |
| 8. Trajeto | Consultas confirmadas oferecem Google Maps, Waze e Apple Maps. Na web e no app nativo, Google/Apple podem sair do endereço cadastrado ou da posição atual; Waze usa a posição atual. A opção fica disponível também antes do dia da consulta para planejar a viagem. |
| 9. Foto do paciente | Seleção e remoção no perfil web e nativo, corte quadrado, redimensionamento e recodificação; bucket privado e URLs temporárias. Na conta nova, a foto é adicionada depois de autenticar/confirmar e-mail, ao completar o perfil. |
| 10. Clínica personalizada | Logo/banner já existiam. A página pública agora utiliza também título, subtítulo, destaques e URL de site configurados no editor, além das avaliações públicas. |
| 11. Avaliações | Aba própria; médico/clínica avaliados publicamente pelo paciente após consulta concluída; nome opcionalmente oculto no banco/API. Avaliação de paciente acessível só a médicos ativos, restrita à nota sobre comunicação/pontualidade, sem texto clínico. Uma avaliação por alvo/consulta/autor. |
| 12. Assinatura certificada | Captura/autorização da representação visual e preservação dos dados da emissão. **Integração de certificação ICP-Brasil ainda não implementada**, pois falta definir e contratar o provedor. Novos documentos permanecem em rascunho e não são liberados como emitidos. O banco impede o cliente de forjar o status assinado. |

## Banco aplicado

**Aplicado e conferido no projeto configurado.** A lista abaixo documenta a ordem para um outro banco que ainda não recebeu esta atualização; não execute novamente no banco já atualizado:

1. `20260916020000_professional_documents.sql`
2. `20260916030000_profiles_reviews.sql`
3. `20260916040000_notifications.sql`
4. `20260916050000_discovery_quota.sql`
5. `20260916060000_doctor_offices.sql`
6. `20260916070000_native_booking.sql`

Elas estão em `supabase/migrations/`. O arquivo `supabase/ATUALIZACAO_20260916.sql` reúne essas seis migrações para execução pelo SQL Editor. A migração antiga de confirmação de consultas permanece separada. Os novos scripts preservam documentos e consultas anteriores; não preenchem retrospectivamente assinaturas nem enviam notificações antigas. Alguns comandos de criação não são idempotentes: use o controle de versões do Supabase e não reaplique o mesmo arquivo.

Para conferir somente se tabelas, campos e RPCs estão expostos no banco configurado, execute `node --env-file=.env.local scripts/check-update-schema.mjs`. A consulta posterior à sua execução retornou todas as verificações como presentes; o script não executa SQL nem lê pacientes.

É necessário acesso ao SQL Editor ou uma conexão PostgreSQL administrativa. A chave `SUPABASE_SERVICE_ROLE_KEY` usada pela aplicação REST não equivale a uma conexão SQL. A migração de agendamento introduz um bloqueio de sobreposição para novas reservas/alterações, compartilhado entre web e nativo. Os horários desse fluxo usam `America/Sao_Paulo`; clínicas em outros fusos precisarão de configuração própria antes de usar esse agendamento nativo.

## Configurar serviços

Copie os nomes de `.env.example` para o ambiente de hospedagem. Não exponha segredos em `NEXT_PUBLIC_*` ou `EXPO_PUBLIC_*`.

- **WhatsApp:** Twilio com WhatsApp Business aprovado, remetente `whatsapp:+55...` e três Content SIDs aprovados (`REQUESTED`, `CONFIRMED`, `REMINDER`). Variáveis dos modelos: `1` = data/hora, `2` = URL de consultas. O texto do modelo REQUESTED deve dizer que a solicitação foi recebida e ainda depende da clínica. Nenhum diagnóstico é enviado.
- **E-mail:** Resend com domínio/remetente verificado. Não basta preencher um remetente fictício.
- **Worker:** executar `GET /api/cron/patient-messages` a cada 5 minutos com `Authorization: Bearer <CRON_SECRET>`. Não colocar o segredo na URL. O cron antigo `appointment-confirmations` mantém sua lógica anterior e pode duplicar lembretes se ambos forem habilitados sem revisar sua agenda. O worker novo não cancela consultas por falta de resposta.
- **Estados de envio:** `accepted` significa aceito pelo provedor, não entregue. Callbacks de entrega ainda não estão integrados. Falha de rede ambígua fica como `unknown`; processo interrompido pode ficar `processing`. Nesses casos, conferir o provedor antes de qualquer reenvio. Isso evita repetir mensagens cujo envio pode já ter ocorrido. Eventos de consultas canceladas/remarcadas são descartados no momento do processamento.
- **Busca:** configurar Google Places API (New), faturamento e chave restrita ao serviço no backend. Resultados externos ficam separados; não são associados a uma conta apenas por semelhança de nome. A IA requer `OPENAI_API_KEY` e um `OPENAI_SEARCH_MODEL` com Structured Outputs na Responses API. As cotas limitam requisições pagas por usuário. O usuário escolhe explicitamente a consulta a cada serviço.
- **Geocodificação:** ViaCEP/OpenStreetMap são as fontes atuais. Para tráfego de produção, revisar a política de uso do Nominatim e contratar/hospedar geocodificador com capacidade adequada. O sistema não promete precisão de porta quando a fonte não possui essa informação.

## Completar certificação ICP-Brasil

A imagem da assinatura não gera um PDF certificado. O próximo trabalho depende do serviço escolhido e deve incluir:

1. Autorização do médico junto ao provedor/certificado, sem guardar senha de certificado no navegador.
2. Geração de um PDF imutável a partir do snapshot salvo, envio para assinatura e associação de uma solicitação única ao documento.
3. Callback autenticado, validação da assinatura/cadeia ICP-Brasil e correspondência entre o titular do certificado e o médico responsável.
4. Armazenamento privado do PDF PAdES original, hash SHA-256 e identificação do certificado. Somente o backend pode marcar `signature_status=signed`, `certificate_verified_at`, `certificate_serial`, `signed_pdf_url`, `document_hash`, `status=issued` e liberar ao paciente.
5. Download autenticado do original e teste de validação externa. Não regenerar um PDF assinado a partir de HTML: a assinatura pertence aos bytes do original.

Até esse fluxo existir, a interface usa “preparar para assinatura digital” e identifica exportações legadas como prévias sem certificação. Isso é um bloqueio intencional; documentos novos não estão prontos para emissão oficial.

## Verificações realizadas

- TypeScript web e nativo.
- 14 testes nativos adicionais: cadastro retomado após confirmação de e-mail, preservação de dados, contas profissionais, CPF/data/UF e origem/destino dos mapas.
- 42 testes web/banco: autenticação/rotas, agenda, geocodificação, telefones, links de mapas e rejeição de requisições inválidas na descoberta.
- PostgreSQL em memória: migrações, autorização de assinatura, bloqueio de falsa certificação, anonimato, acesso médico às avaliações de pacientes, deduplicação/claim da fila, cota de busca e reserva de horário com proteção contra sobreposição.
- Playwright com respostas simuladas: auditoria de 45 páginas por largura (1440 e 390 px), erros JS/overflow/redirecionamentos, navegação por busca/menu para os três papéis, origem/destino dos mapas e PDF com múltiplas páginas. Relatórios e capturas locais em `artifacts/interface/` e `artifacts/new-journeys/`. Não substitui homologação conectada ao Supabase real.
- Build Next e exportação Metro para Android/iOS. Não foram executados emuladores nem testes físicos.

## Referências dos contratos utilizados

- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
- [Google Places Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [WhatsApp templates no Twilio](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates)
- [Structured Outputs na OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Certificado digital oferecido pelo CFM](https://certificadodigital.cfm.org.br/)
- [Política de uso do Nominatim](https://operations.osmfoundation.org/policies/nominatim/)
- [Projetos Expo](https://docs.expo.dev/get-started/create-a-project/)

## Revisão visual de 17/09/2026

Cores base preservadas: petróleo `#164957`, grafite `#2E393F`, areia `#FAF6F3`, roxo `#5A4C86`, sálvia `#7A9D8C` e os tons claros existentes. A estrutura compartilhada adapta desktop e celular; os formulários mantêm seus campos e ações. Estados de erro continuam diferenciados.

O código da assinatura certificada permanece pendente, assim como callbacks de entrega, busca/agendamento de consultórios autônomos e etapas de publicação nas lojas. Não há ativação automática de serviços pagos. Consulte o guia de integrações antes de ligar o cron, pois a fila pode conter eventos de testes.

A página **Sobre** foi ampliada com propósito, benefícios e ações por perfil, cinco etapas da jornada, seis recursos explicados, cuidados com informações, sete perguntas frequentes e links de cadastro. As respostas esclarecem o status de mensagens, assinatura certificada e aplicativo móvel. Verificação adicional a 390/1440 px: links, ausência de overflow/erros JS e abertura/fechamento do FAQ com mouse e teclado. Build de produção concluído após essa alteração.

## Publicação web em 17/09/2026

Implantação Vercel `dpl_BBUXmFkEoJ8eZb6w6qHJPQKSmJYo`, estado READY, alias de produção https://medinexus-web.vercel.app. Build e TypeScript concluídos na Vercel. Nova conferência da estrutura Supabase: todas as tabelas, RPCs e campos esperados presentes. Nenhuma migração foi reaplicada; nenhuma integração paga ou cron novo foi ativado.

Verificação posterior à publicação: **48 páginas/perfis aprovados**, com contas de demonstração e banco real, sem erros JS, falhas HTTP observadas, overflow ou destinos incorretos. O modo `SMOKE_READ_ONLY=1` não salva perfis, não cria consultas e não envia mensagens. Relatório em `artifacts/smoke-production-readonly.json`. Isso não valida entregas dos fornecedores nem a futura certificação.
