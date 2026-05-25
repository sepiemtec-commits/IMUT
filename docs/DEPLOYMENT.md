# Deploy — IMUT

## Ambientes

| Ambiente | Compose | Domínio |
|----------|---------|---------|
| local | `infra/docker/docker-compose.yml` | localhost |
| staging | mesmo + secrets | staging.imut.app |
| production | Swarm/K8s ou VPS | api.imut.app |

## Serviços Docker

| Container | Imagem / build | Porta |
|-----------|----------------|-------|
| `postgres` | postgres:16-alpine | 5432 |
| `redis` | redis:7-alpine | 6379 |
| `api` | apps/api Dockerfile | 3000 |
| `mqtt-ingest` | services/mqtt-ingest | — |
| `worker` | services/worker | — |
| `nginx` | infra/nginx | 80, 443 |

## Nginx

- `/` → API upstream `api:3000`
- `/health` → healthcheck
- TLS Let's Encrypt (certbot sidecar em prod)
- `client_max_body_size 1m` (webhooks Stripe)

## Variáveis obrigatórias (prod)

Ver `.env.example`. Críticas:

- `DATABASE_URL`, `REDIS_URL`
- `JWT_*_SECRET` (32+ chars)
- `STRIPE_*`, `MQTT_*`
- `SMTP_*` para relatórios

## Healthchecks

- API: `GET /health` → `{ "status": "ok", "db": "ok", "redis": "ok" }`
- mqtt-ingest: métrica última mensagem < 10 min
- worker: BullMQ dashboard ou `/health` com fila lag

## CI/CD (sugestão)

1. `pnpm install && turbo build`
2. `prisma migrate deploy`
3. Build images → registry
4. Rolling update api → worker → mqtt-ingest

## Backup

- Postgres: snapshot diário (retenção 30d)
- Redis: AOF opcional (filas reprocesáveis)

## Monitoramento

- Logs estruturados (pino) → Loki/CloudWatch
- Alertas: fila `reports` failed, MQTT disconnect > 5 min
- Sentry no api + worker
