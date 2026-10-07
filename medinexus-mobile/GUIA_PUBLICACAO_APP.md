# Guia de Publicação do Aplicativo MediNexus (iOS & Android)

Este guia contém o passo a passo completo para compilar, testar e publicar o aplicativo **MediNexus** na **Apple App Store** (iOS) e na **Google Play Store** (Android).

---

## 1. Teste Imediato no seu iPhone (Sem Custo via Expo Go)

Você pode testar tudo agora mesmo no seu aparelho físico:

1. Baixe o app **Expo Go** na App Store do seu iPhone.
2. No seu computador, abra o terminal na pasta do app e execute:
   ```bash
   cd medinexus-mobile
   npx expo start
   ```
3. Abra a câmera do seu iPhone e aponte para o **QR Code** exibido no terminal.
4. O app será carregado instantaneamente com suporte a:
   - Autenticação biométrica por Face ID;
   - Notificações locais e alertas em segundo plano;
   - Triagem pré-consulta com IA;
   - Telemedicina e chat pós-consulta.

---

## 2. Configurações de Publicação Já Aplicadas

As configurações de privacidade e conformidade já foram inseridas no [`app.json`](./app.json):

* **Nome do App:** `MediNexus`
* **Bundle Identifier iOS:** `com.medinexus.app`
* **Package Android:** `com.medinexus.app`
* **Versão:** `1.0.0` (Build 1)
* **Permissões Justificadas para a Apple (Info.plist):**
  - `NSFaceIDUsageDescription`: Acesso biométrico seguro ao prontuário e assinatura protegida.
  - `NSCameraUsageDescription`: Telemedicina criptografada e leitura de receitas/exames.
  - `NSMicrophoneUsageDescription`: Áudio em consultas de telemedicina.
  - `NSPhotoLibraryUsageDescription`: Anexar exames e fotos de receitas ao prontuário.
  - `NSLocationWhenInUseUsageDescription`: Localizar consultórios e laboratórios parceiros mais próximos.
  - `ITSAppUsesNonExemptEncryption`: `false` (dispensa questionário demorado de criptografia no TestFlight).

---

## 3. Publicação no iOS (Apple App Store / TestFlight)

### Pré-requisitos:
1. Conta no [Apple Developer Program](https://developer.apple.com) ($99/ano).
2. Conta gratuita no [Expo / EAS](https://expo.dev).

### Passo a Passo:
1. Instale o EAS CLI globalmente (se ainda não tiver):
   ```bash
   npm install -g eas-cli
   ```
2. Faça login na sua conta Expo:
   ```bash
   eas login
   ```
3. Vincule o projeto:
   ```bash
   eas project:init
   ```
4. Gere a build para o **TestFlight**:
   ```bash
   npm run build:ios
   ```
   *(O EAS cuidará automaticamente dos certificados Apple, Provisioning Profiles e compilação do `.ipa` na nuvem).*
5. Enviar diretamente para a App Store Connect:
   ```bash
   eas submit -p ios
   ```
6. No painel [App Store Connect](https://appstoreconnect.apple.com), acerte a descrição, screenshots e submeta para revisão.

---

## 4. Publicação no Android (Google Play Store)

### Pré-requisitos:
1. Conta no [Google Play Console](https://play.google.com/console) (taxa única de $25).

### Passo a Passo:
1. Gere o pacote de produção otimizado (`.aab` - Android App Bundle):
   ```bash
   npm run build:android
   ```
2. O arquivo compilado poderá ser baixado diretamente pelo link fornecido pelo EAS.
3. No [Google Play Console](https://play.google.com/console):
   - Crie um novo aplicativo chamado **MediNexus**;
   - Faça upload do arquivo `.aab` na faixa de **Teste Interno** ou **Produção**;
   - Preencha a classificação de conteúdo e política de privacidade.

---

## 5. Dicas de Aprovação Rápida na Apple
- As permissões no `Info.plist` já estão redigidas com foco na saúde e benefício do usuário, evitando rejeições comuns da diretriz 5.1.1 da Apple.
- Crie um usuário de teste (ex: `teste.apple@medinexus.com.br`) na base de dados para fornecer à equipe de revisão da Apple no App Store Connect.
