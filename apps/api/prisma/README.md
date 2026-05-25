# Prisma — IMUT

## Entidades

| Modelo | Descrição |
|--------|-----------|
| `User` | Conta de login (dono da empresa) |
| `Company` | Empresa / tenant SaaS |
| `Responsible` | Responsável notificado (máx. 5) |
| `Device` | ESP32 (máx. 10) |
| `SensorReading` | Temperatura, umidade, timestamp, ambiente |
| `Alert` | Alerta de anomalia |
| `WeeklyReport` | Relatório semanal |
| `AiInsight` | Snapshot de anomalia / resumo semanal (IA) |
| `PushToken` | Token FCM por usuário (app mobile) |
| `AlertNotification` | Log de envio e-mail / push por alerta |
| `AuditLog` | Logs de auditoria de segurança |
| `Subscription` | Assinatura Stripe |
| `Payment` | Cobranças / faturas |

### Limites no `Device`

- `tempMaxCelsius`, `humidityMaxPercent` — limiares de alerta
- `alertAfterCycles` — ciclos consecutivos (padrão **2** × 4 min)

## Limites (aplicação)

```ts
import { LIMITS } from "@imut/shared";

// antes de criar Device
const count = await prisma.device.count({ where: { companyId, isActive: true } });
if (count >= LIMITS.MAX_DEVICES_PER_ORG) throw new Error("DEVICE_LIMIT");

// antes de criar Responsible
const resp = await prisma.responsible.count({ where: { companyId, isActive: true } });
if (resp >= LIMITS.MAX_RESPONSIBLES_PER_ORG) throw new Error("MEMBER_LIMIT");
```

## Comandos

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```
