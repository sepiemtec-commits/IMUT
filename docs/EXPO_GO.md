# IMUT — Expo Go no celular

## Checklist rápido

1. **API** rodando: `pnpm --filter @imut/api dev` → `curl http://192.168.0.23:3000/health`
2. **Mesma Wi‑Fi** no PC e no celular
3. **`apps/mobile/.env`** com IP do PC (não `localhost`):
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.0.23:3000
   ```
4. **Expo:** `pnpm mobile:dev` → escanear QR no **Expo Go**

## Se o QR não abrir o app

```bash
pnpm mobile:dev:tunnel
```

Modo túnel funciona mesmo com rede complicada (mais lento).

## Erro de conexão no login

- Confirme o IP: `hostname -I`
- No celular, abra no navegador: `http://SEU_IP:3000/health` — deve mostrar JSON
- Reinicie Expo após mudar `.env`: `Ctrl+C` e `pnpm mobile:dev`

## Alternativa sem celular

```bash
cd apps/mobile && pnpm dev:web
```

Tecla **w** ou acesse `http://localhost:8081` no PC.
