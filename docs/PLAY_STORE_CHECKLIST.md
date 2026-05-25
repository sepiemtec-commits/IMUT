# Checklist — Publicar na Play Store

## 1. Pré-requisitos (faça uma vez)

- [ ] Conta [Google Play Console](https://play.google.com/console) — taxa única ~US$ 25
- [ ] Conta [Expo](https://expo.dev) — grátis
- [ ] API em produção com HTTPS: `https://api.imut.app`
- [ ] `EXPO_PUBLIC_EAS_PROJECT_ID` preenchido após `eas init`

## 2. Configurar EAS

```bash
source ~/.bashrc && nvm use 20
cd ~/Área\ de\ trabalho/tec/apps/mobile
eas login           # login na conta expo.dev
eas init            # gera projectId e atualiza app.config.js
```

## 3. Ícones obrigatórios

Substitua os ícones placeholder em `apps/mobile/assets/`:

| Arquivo | Tamanho | Obs |
|---------|---------|-----|
| `icon.png` | 1024×1024 | Fundo sólido, sem transparência |
| `adaptive-icon.png` | 1024×1024 | Frente transparente |
| `splash-icon.png` | 1284×2778 | Imagem de splash |

## 4. Gerar APK de teste (preview)

```bash
source ~/.bashrc && nvm use 20
cd ~/Área\ de\ trabalho/tec/apps/mobile
eas build --platform android --profile preview
```

Instale o APK no celular e teste tudo antes de publicar.

## 5. Gerar AAB de produção

```bash
eas build --platform android --profile production
```

Aguarde o link do `.aab` no terminal ou em [expo.dev/builds](https://expo.dev/builds).

## 6. Play Console — criar app e preencher ficha

1. **Criar app** → Nome: IMUT
2. **Ficha da loja** → copiar textos de `google-play/listing-pt-BR.md`
3. **Ícone** 512×512 + **Feature graphic** 1024×500
4. **Screenshots** mínimo 2 (1080×1920)
5. **Política de privacidade** → publicar URL pública (modelo em `google-play/politica-privacidade-modelo.md`)
6. **Classificação de conteúdo** → responder questionário

## 7. Enviar AAB

- Play Console → **Produção** (ou **Testes internos**) → Criar versão
- Fazer upload do `.aab`
- Notas da versão → copiar de `google-play/listing-pt-BR.md`
- Enviar para análise

## 8. Envio automático (opcional)

```bash
# Baixar service-account.json da Play Console → API access
# Salvar em apps/mobile/google-play/service-account.json
eas submit --platform android --profile production --latest
```

## 9. Próximas versões

```bash
# Apenas incrementar versionCode (autoIncrement: true no eas.json)
eas build --platform android --profile production
eas submit --platform android --profile production --latest
```
