# API REST — IMUT

Base URL: `https://api.imut.app/v1` (dev: `http://localhost:3000/v1`)

## Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cria usuário + org (trial opcional) |
| POST | `/auth/login` | Retorna `accessToken`, `refreshToken` |
| POST | `/auth/refresh` | Renova access |
| POST | `/auth/logout` | Revoga refresh |
| GET | `/auth/me` | Perfil + memberships |

Header: `Authorization: Bearer <accessToken>`

## Billing (Stripe)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/billing/checkout` | Sessão Checkout (assinatura) |
| POST | `/billing/portal` | Customer Portal |
| POST | `/webhooks/stripe` | Webhook (raw body, sem JWT) |

## Organização

| Método | Rota | Role |
|--------|------|------|
| GET | `/organizations/:id` | VIEWER+ |
| PATCH | `/organizations/:id` | OWNER |

## Ambientes

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/organizations/:orgId/environments` | Lista |
| POST | `/organizations/:orgId/environments` | ADMIN+ |
| GET | `/environments/:id` | Detalhe + última leitura |
| PATCH | `/environments/:id` | ADMIN+ |
| DELETE | `/environments/:id` | OWNER |

## Dispositivos (ESP32)

Máximo 10 por organização.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/organizations/:orgId/devices` | Lista |
| POST | `/organizations/:orgId/devices` | Registra + credenciais MQTT |
| PATCH | `/devices/:id` | Atualiza ambiente/nome |
| DELETE | `/devices/:id` | Desativa |
| POST | `/devices/:id/rotate-credentials` | OWNER |

## Leituras e alertas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/environments/:id/readings` | Query `from`, `to`, `limit` |
| GET | `/organizations/:orgId/alerts` | Filtro `status`, `severity` |
| PATCH | `/alerts/:id/acknowledge` | ADMIN+ |

## Responsáveis (máx. 5)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/organizations/:orgId/members` | Lista |
| POST | `/organizations/:orgId/invites` | Convite e-mail |
| DELETE | `/memberships/:id` | OWNER |

## Relatórios e IA

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/organizations/:orgId/reports/weekly` | Histórico PDF/JSON |
| GET | `/environments/:id/insights` | Últimos `AiInsight` |

## Códigos de erro

| HTTP | Código | Significado |
|------|--------|-------------|
| 401 | `UNAUTHORIZED` | Token inválido |
| 402 | `SUBSCRIPTION_REQUIRED` | Assinatura inativa |
| 403 | `FORBIDDEN` | Role insuficiente |
| 409 | `DEVICE_LIMIT` | > 10 ESP32 |
| 409 | `MEMBER_LIMIT` | > 5 responsáveis |

## Middleware chain

```
requestId → cors → helmet → rateLimit → json
  → /webhooks/stripe (raw)
  → /v1 → authenticate → requireActiveSubscription → requireRole → handler
```
