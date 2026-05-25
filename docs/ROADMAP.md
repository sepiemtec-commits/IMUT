# Roadmap IMUT

## Etapa 1 — Arquitetura (atual)

- [x] Monorepo pnpm + Turbo
- [x] Schema Prisma completo
- [x] Esqueleto API, mobile, mqtt-ingest, worker
- [x] Docker Compose + Nginx
- [x] Documentação (arquitetura, API, MQTT, deploy)

## Etapa 2 — Backend + Auth + Stripe

- [ ] Register / login / refresh JWT
- [ ] Webhooks Stripe + middleware assinatura
- [ ] CRUD ambientes, devices (limite 10), membros (limite 5)
- [ ] Jobs worker completos (Prisma)
- [ ] E-mail de alerta

## Etapa 3 — IoT

- [ ] Sketch ESP32 + provisionamento
- [ ] ACL HiveMQ por org
- [ ] Teste end-to-end telemetria

## Etapa 4 — Mobile

- [ ] Auth + secure store
- [ ] Dashboard e gráficos
- [ ] Deep link Stripe Checkout

## Etapa 5 — IA + relatórios

- [ ] Anomalias e predição
- [ ] Relatório semanal LLM + SMTP
- [ ] Push notifications (opcional)
