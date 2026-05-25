# Segurança — IMUT

## Camadas implementadas

| Requisito | Implementação |
|-----------|----------------|
| JWT + refresh | Access 15m + refresh 7d com **rotação** a cada refresh |
| bcrypt | 12 rounds em `auth.service` |
| Zod | `validateBody` / `validateQuery` em rotas |
| Helmet | HSTS, CSP, nosniff, frameguard |
| Rate limit | Auth 20/15min, refresh 60/15min, API 500/15min |
| RBAC | `PERMISSIONS` em `@imut/shared` + `requirePermission` |
| Auditoria | `AuditLog` + middleware + `GET /v1/audit-logs` |
| HTTPS | `requireHttps` + `TRUST_PROXY` + Nginx TLS |

## RBAC

| Papel | Escopo |
|-------|--------|
| **OWNER** | Billing, responsáveis, auditoria, tudo |
| **ADMIN** | Operação (sem billing/auditoria) |
| **VIEWER** | Somente leitura |

JWT inclui `role` e `companyId`; `authenticate` revalida no banco a cada request.

## Variáveis de ambiente

```env
JWT_ACCESS_SECRET=...   # mín. 32 caracteres
JWT_REFRESH_SECRET=...
TRUST_PROXY=true        # atrás de Nginx/ALB
FORCE_HTTPS=true        # opcional em staging
```

## Nginx (HTTPS obrigatório)

```nginx
server {
  listen 443 ssl http2;
  ssl_certificate     /etc/letsencrypt/live/api.imut.app/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.imut.app/privkey.pem;

  location / {
    proxy_pass http://api:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}

server {
  listen 80;
  return 301 https://$host$request_uri;
}
```

## Senha (registro)

- Mínimo 8 caracteres
- Maiúscula, minúscula e número

## Auditoria

Eventos: `AUTH_LOGIN`, `AUTH_LOGIN_FAILED`, `AUTH_REGISTER`, `AUTH_REFRESH`, `AUTH_LOGOUT`, mutações HTTP.

```bash
pnpm db:migrate
```
