# IMUT Mobile

App React Native (Expo) para monitoramento IoT.

## Stack

- **Expo Router** — navegação (tabs + auth)
- **React Query** — dados em tempo real (refetch 1 min)
- **Zustand** — sessão JWT
- **NativeWind** — estilos Tailwind
- **react-native-gifted-charts** — gráficos temp/umidade

## Telas

| Rota | Tela |
|------|------|
| `/login` | Login e registro |
| `/(tabs)` | Dashboard |
| `/(tabs)/sensors` | Sensores + gráficos 24h |
| `/(tabs)/alerts` | Alertas ativos |
| `/(tabs)/reports` | Relatórios semanais |
| `/(tabs)/profile` | Perfil e logout |
| `/subscription` | Assinatura Stripe |

## Publicar na Google Play

Guia completo: **[google-play/PUBLICAR_GOOGLE_PLAY.md](./google-play/PUBLICAR_GOOGLE_PLAY.md)**

Textos da loja: **[google-play/listing-pt-BR.md](./google-play/listing-pt-BR.md)**

```bash
eas build --platform android --profile production
```

## SDK

**Expo SDK 56** — compatível com o Expo Go atual (Play Store / App Store).

**Obrigatório:** Node **20+** (`nvm use 20`). Com Node 18 o Expo quebra e pode mostrar SDK errado.

## Executar

```bash
# API rodando em localhost:3000
echo "EXPO_PUBLIC_API_URL=http://SEU_IP:3000" >> apps/mobile/.env

pnpm --filter @imut/mobile dev
```

No dispositivo físico, use o IP da máquina (não `localhost`).

## Estrutura

```
app/
  (tabs)/     # app autenticado
  login.tsx
  subscription.tsx
components/
hooks/queries.ts
store/auth.store.ts
```
