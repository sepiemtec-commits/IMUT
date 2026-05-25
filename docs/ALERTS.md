# Sistema de alertas — IMUT

## Disparo

1. ESP32 envia leitura → `mqtt-ingest` grava `SensorReading`
2. Fila **ALERTS** → `evaluateAnomaly` (`@imut/ai-analysis`)
3. Se **2 ciclos consecutivos** acima do limite (ou elevação anormal):
   - Cria `Alert` no PostgreSQL com **ambiente afetado**
   - Enfileira **NOTIFICATIONS** → `dispatch-alert`

## Notificações (BullMQ)

Job `dispatch-alert` em paralelo:

| Canal | Tecnologia | Destinatários |
|-------|------------|---------------|
| E-mail | Nodemailer (SMTP) | Owner + até 5 responsáveis |
| Push | Firebase Cloud Messaging | Tokens em `PushToken` |

Registro em `AlertNotification` + `emailSentAt` / `pushSentAt` no alerta.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/alerts` | Lista alertas (`?status=OPEN&environment=`) |
| GET | `/v1/alerts/:id` | Detalhe |
| PATCH | `/v1/alerts/:id/acknowledge` | Marcar como reconhecido |
| POST | `/v1/push-tokens` | `{ token, platform: IOS\|ANDROID\|WEB }` |

## Mobile

- `getDevicePushTokenAsync()` → token **FCM** nativo (recomendado com `firebase-admin`)
- POST `/v1/push-tokens` após login
- Tela `/alerts` exibe **ambiente afetado**, título e severidade
- Requer dev build (EAS) com FCM configurado no Expo dashboard

## Configuração

```env
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
FCM_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Worker: `pnpm worker:dev`  
MQTT: `pnpm mqtt:dev`
