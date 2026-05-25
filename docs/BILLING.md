# Assinatura SaaS — Stripe

## Regras implementadas

| Regra | Implementação |
|-------|----------------|
| Acesso só após pagamento | `requireActiveSubscription` — `ACTIVE` ou `TRIALING` |
| Cobrança mensal | Checkout `mode: subscription` + `STRIPE_PRICE_ID_MONTHLY` |
| Bloquear inadimplente | `PAST_DUE`, `UNPAID`, `CANCELED`, `INCOMPLETE` → HTTP 402 |
| Máx. 5 responsáveis | `POST /v1/organizations/:orgId/responsibles` |
| Permissões JWT | `role`: `OWNER` \| `ADMIN` \| `VIEWER` |

## Fluxo

```text
1. POST /v1/auth/register  → Company + Subscription INCOMPLETE + JWT
2. POST /v1/billing/checkout → Stripe Checkout (mensal)
3. Webhook checkout.session.completed → Subscription ACTIVE
4. Rotas protegidas liberadas (alertas, devices, MQTT com assinatura)
```

## API

| Método | Rota | Auth | Assinatura |
|--------|------|------|------------|
| POST | `/v1/auth/register` | — | — |
| POST | `/v1/auth/login` | — | — |
| POST | `/v1/billing/checkout` | OWNER | — |
| POST | `/v1/billing/portal` | OWNER | — |
| GET | `/v1/billing/status` | JWT | — |
| POST | `/webhooks/stripe` | assinatura Stripe | — |

## Webhooks (configurar no Dashboard)

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

## Variáveis

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
APP_URL=http://localhost:8081
```

Crie um **Price** recorrente mensal em BRL no Stripe Dashboard e cole o ID em `STRIPE_PRICE_ID_MONTHLY`.

## Papéis (JWT)

- **OWNER** — billing, responsáveis, tudo
- **ADMIN** — gerencia responsáveis e operação (sem billing)
- **VIEWER** — leitura
