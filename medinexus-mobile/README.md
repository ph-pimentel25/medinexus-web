# MediNexus para Android e iPhone

Aplicativo nativo Expo/React Native em desenvolvimento. **Ainda não publicado nas lojas, sem APK/IPA de produção.** Não se trata apenas de um atalho PWA.

## Funcionalidades nativas

Cadastro de paciente com confirmação de e-mail, login com sessão no armazenamento seguro do dispositivo, início, consultas, confirmação de presença, busca de profissionais cadastrados e contatos externos, consulta à agenda e solicitação de consulta particular, documentos liberados, edição de dados pessoais, endereço por CEP/GPS, escolha/remoção de foto, preferências de avisos e mapas. A busca com IA e contatos do Google Maps é opcional e depende dos serviços configurados no backend. Google Maps e Apple Maps permitem sair do endereço residencial ou posição atual; Waze usa a posição atual. A solicitação particular depende da confirmação da clínica; o app não cobra nem determina valores. Os RPCs de agenda e reserva precisam das migrações web.

Avaliações, convênios e cadastro/gestão de médicos e clínicas ainda abrem a plataforma web, que pode pedir um novo login. Essa versão não tem paridade integral com a web.

## Executar

1. Instalar Node LTS e executar `npm install` nesta pasta.
2. Preencher `.env.local` a partir de `.env.example` com a URL e chave pública do mesmo Supabase, e a URL HTTPS da versão web atualizada. Nunca copiar chaves de serviço, IA ou mensageria para o aplicativo.
3. As migrações já foram aplicadas ao projeto Supabase usado nesta entrega. Não reaplicar nesse banco; em outro ambiente novo, seguir a documentação web. Disponibilizar a API `/api/discovery` na URL configurada.
4. Executar `npm start` e abrir com um development build/Expo compatível com SDK 57. `npm run android` e `npm run ios` exigem o ambiente nativo correspondente.
5. Validar `npm test`, `npm run typecheck` e `npm run export`.
6. Para uma conta nova, confirmar o e-mail pelo link recebido e voltar ao aplicativo para entrar. O perfil incompleto é retomado sem sobrescrever os dados já existentes. A confirmação usa o serviço de autenticação Supabase, separado dos avisos de consultas.

A configuração pública do projeto web foi copiada para um `.env.local` ignorado pelo Git, sem chaves secretas. Atualize a URL se usar homologação.

## Gerar e publicar

O `eas.json` inclui perfis de desenvolvimento, APK de prévia e produção. Antes de `eas build`, vincular o projeto à conta Expo, conferir os identificadores `com.medinexus.app`, configurar ambientes e preparar credenciais das lojas. Build iOS local exige macOS/Xcode; é possível usar infraestrutura de build em nuvem com sua conta.

- Prévia Android: `eas build --platform android --profile preview`.
- Produção: `npm run build:android` ou `npm run build:ios`.
- Publicação exige suas contas Google Play Console e Apple Developer, certificados/perfis, política de privacidade, declarações de coleta de dados, suporte, revisão de acessibilidade e testes em aparelhos. A aprovação das lojas não está garantida por um build bem-sucedido.
- Não foi disparado build remoto, envio a TestFlight, upload para lojas ou contratação paga.

As exportações em `dist/` são bundles JavaScript/Hermes e assets, não arquivos instaláveis APK/IPA.

## Fotos, endereço e verificação

As fotos são selecionadas pela biblioteca do aparelho, recortadas/redimensionadas para 512 × 512 e recodificadas como JPEG antes do envio ao bucket privado `patient-avatars`. O app não solicita câmera nem microfone. A URL de leitura é temporária. A opção de foto fica disponível após autenticar, na etapa de completar o perfil; não é enviada para os metadados públicos de autenticação.

Editar o endereço invalida coordenadas anteriores. O GPS precisa ser autorizado e o paciente deve confirmar que a posição atual corresponde à residência. CEP e preenchimento manual não inventam coordenadas. Convênios existentes são preservados; a administração do plano permanece na web.

A gravação dos dados usa as permissões do próprio paciente no Supabase. Perfil e cadastro de paciente são gravados em duas operações; uma falha parcial é informada para permitir concluir pelo botão de salvar. Os testes unitários cobrem retomada de cadastro, precedência de papéis, preservação de dados, UF/CPF/data e rotas dos mapas. Não substituem testes em aparelhos físicos, inclusive seletor de foto, teclado, permissões e confirmação de e-mail.

A auditoria de dependências de 16/09/2026 apontou dez avisos moderados na cadeia Expo/Xcode/uuid, sem avisos altos ou críticos. A correção automática sugerida pelo npm retrocede para um SDK incompatível; não foi aplicada. É necessário acompanhar a atualização compatível dessas dependências antes de publicar.

## Visual e próximos passos

A revisão de 17/09 usa a paleta original compartilhada em `src/theme.ts`, cartões de acesso rápido, navegação por ícones, botões com estados de toque e componentes de formulário consistentes. TypeScript, 14 testes e exportações Android/iOS foram executados após a mudança. A aparência e as permissões ainda precisam de conferência em aparelhos físicos.

O [guia de integrações](../medinexus-web/GUIA_INTEGRACOES.md) traz valores e passos para serviços e lojas. Antes de submeter, concluir política de privacidade, suporte e exclusão de conta, configurar contas/ambientes EAS e homologar os recursos reais. Exportação de JavaScript não significa aplicativo publicado.
