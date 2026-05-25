# Publicar o IMUT na Google Play

Guia passo a passo para gerar o **AAB** e enviar ao **Google Play Console**.

---

## 1. Pré-requisitos

1. Conta [Google Play Console](https://play.google.com/console) (taxa única ~US$ 25)
2. Conta [Expo](https://expo.dev) (grátis)
3. Node.js 20+ e pnpm
4. Ícones em `apps/mobile/assets/` (ver `assets/README.md`)
5. API em produção com **HTTPS**: `https://api.imut.app`

---

## 2. Instalar ferramentas

```bash
npm install -g eas-cli
eas login
```

Na pasta do app:

```bash
cd apps/mobile
pnpm install
```

---

## 3. Configurar variáveis

Crie `apps/mobile/.env` (ou use EAS Secrets):

```env
EXPO_PUBLIC_API_URL=https://api.imut.app
EXPO_PUBLIC_EAS_PROJECT_ID=seu-project-id-expo
```

Registrar projeto Expo:

```bash
eas init
```

Salvar o `projectId` em `app.json` → `extra.eas.projectId` (o comando `eas init` faz isso).

---

## 4. Gerar o Android App Bundle (AAB)

```bash
cd apps/mobile
eas build --platform android --profile production
```

- Saída: arquivo **`.aab`** (obrigatório na Play Store)
- Download: link no terminal ou [expo.dev](https://expo.dev) → Builds

Teste interno (APK, opcional):

```bash
eas build --platform android --profile preview
```

---

## 5. Google Play Console

### 5.1 Criar app

1. **Criar app** → Nome: **IMUT**
2. Idioma padrão: **Português (Brasil)**
3. Tipo: **App** / **Utilitário**

### 5.2 Preencher ficha da loja

Use os textos em [`listing-pt-BR.md`](./listing-pt-BR.md):

- Descrição curta e completa
- Ícone 512×512
- Feature graphic 1024×500
- Screenshots (mín. 2): telefone 1080×1920 ou superior

### 5.3 Política de privacidade

URL pública obrigatória, ex.: `https://imut.app/privacidade`

Modelo em [`politica-privacidade-modelo.md`](./politica-privacidade-modelo.md).

### 5.4 App content / Data safety

Declarar:

- E-mail (conta)
- Token de notificação (FCM)
- Dados de sensores (via conta empresarial, não no dispositivo diretamente do ESP32)

### 5.5 Firebase (push)

1. Crie projeto no [Firebase Console](https://console.firebase.google.com)
2. Adicione app Android com pacote `app.imut.mobile`
3. Baixe `google-services.json` → `apps/mobile/google-play/google-services.json`
4. Em `app.json`, dentro de `android`, adicione:

```json
"googleServicesFile": "./google-play/google-services.json"
```

### 5.6 Assinatura do app (Upload)

1. **Produção** → **Criar nova versão**
2. Enviar o **`.aab`** do EAS Build
3. Notas da versão (ver `listing-pt-BR.md`)
4. Revisar e **enviar para análise**

---

## 6. Envio automático (opcional)

1. Play Console → **API access** → criar **Service Account**
2. Baixar JSON → salvar como `apps/mobile/google-play/service-account.json`  
   (não commitar — já está no `.gitignore`)
3. Dar permissão **Release manager** na Play Console

```bash
eas submit --platform android --profile production --latest
```

---

## 7. Checklist antes de publicar

- [ ] `EXPO_PUBLIC_API_URL` aponta para API HTTPS em produção
- [ ] Assinatura Stripe e login testados no build de preview
- [ ] Push notifications (FCM) configuradas no Expo dashboard
- [ ] Ícones e screenshots adicionados
- [ ] Política de privacidade publicada na web
- [ ] `version` e `versionCode` atualizados em `app.json`

---

## 8. Atualizar versão (próximas releases)

Em `app.json`:

```json
"version": "0.2.0"
```

No Android, o EAS com `"autoIncrement": true` incrementa o `versionCode` automaticamente.

```bash
eas build --platform android --profile production
eas submit --platform android --profile production --latest
```

---

## Arquivos deste pacote

| Arquivo | Uso |
|---------|-----|
| `eas.json` | Perfis de build e submit |
| `google-play/listing-pt-BR.md` | Textos da loja |
| `google-play/PUBLICAR_GOOGLE_PLAY.md` | Este guia |
| `assets/README.md` | Ícones obrigatórios |

Suporte técnico: documentação Expo — [Submit to Google Play](https://docs.expo.dev/submit/android/)
