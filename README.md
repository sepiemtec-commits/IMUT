# IMUT

SaaS IoT para monitoramento de **temperatura** e **umidade** em ambientes críticos (até 10 ESP32 por conta, medições a cada 4 minutos).

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Mobile | React Native, Expo, TypeScript, NativeWind |
| API | Node.js, Express, Prisma, PostgreSQL |
| Filas | Redis, BullMQ |
| IoT | ESP32, MQTT, HiveMQ Cloud |
| Pagamentos | Stripe (assinatura) |
| Auth | JWT (access + refresh) |
| IA | Anomalias, predição de temperatura, relatório semanal |
| Infra | Docker, Nginx, Redis |

## Monorepo

```
imut/
├── apps/
│   ├── api/          # REST API (Express)
│   └── mobile/       # App Expo
├── packages/
│   └── shared/       # Tipos, constantes, validações Zod
├── services/
│   ├── mqtt-ingest/  # Subscriber MQTT → Redis/BullMQ
│   └── worker/       # Jobs: alertas, IA, e-mail semanal
├── infra/
│   ├── docker/       # Compose (Postgres, Redis, serviços)
│   └── nginx/        # Reverse proxy
└── docs/             # Arquitetura detalhada
```

## Requisitos de negócio

- Até **10 ESP32** por organização
- Medições a cada **4 minutos**
- Até **5 responsáveis** (usuários convidados)
- **Login** + **assinatura paga** (Stripe) para acesso
- Alertas de aumento anormal + identificação do ambiente
- **Relatório semanal** por e-mail (job agendado + IA)

## Pré-requisitos

- **Docker** + **docker-compose** (Debian: `sudo apt install docker.io docker-compose`)
  - Após instalar: `sudo usermod -aG docker $USER` e **abra um terminal novo** (ou `newgrp docker`)
  - `pnpm docker:up` sobe só **PostgreSQL** e **Redis**; stack completa: `pnpm docker:up:full`
- **Node.js 20+** (você tem v18 — atualize com [nvm](https://github.com/nvm-sh/nvm) ou o instalador em [nodejs.org](https://nodejs.org))
- **pnpm 9+** — se `pnpm` não existir:

```bash
mkdir -p ~/.local/bin
npm install -g pnpm@9.15.0 --prefix ~/.local
export PATH="$HOME/.local/bin:$PATH"   # ou abra um novo terminal após atualizar o ~/.bashrc
pnpm -v
```

## Início rápido

```bash
pnpm install
cp .env.example .env
pnpm docker:up          # se der "Permission denied": abra terminal novo ou veja abaixo
pnpm db:setup           # cria tabelas (db push) — mais simples que migrate no 1º uso
# ou: pnpm db:migrate   # pede nome da migration na 1ª vez
pnpm dev
```

Documentação completa: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## Licença

Proprietário — IMUT © 2026
