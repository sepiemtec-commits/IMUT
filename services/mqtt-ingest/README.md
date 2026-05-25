# IMUT — MQTT Ingest (HiveMQ Cloud)

Serviço Node.js + TypeScript que subscreve telemetria dos ESP32 via **MQTT.js**, valida o payload e grava **`SensorReading`** no PostgreSQL com **Prisma**.

## Payload ESP32 (a cada 4 min)

Tópico:

```
imut/{companyId}/{deviceId}/telemetry
```

JSON:

```json
{
  "deviceId": "clxx...",
  "temperature": 22.5,
  "humidity": 65.0,
  "environment": "Câmara fria",
  "timestamp": 1716566400
}
```

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `deviceId` | string (cuid) | sim |
| `temperature` | °C | sim |
| `humidity` | % | sim |
| `environment` | string | sim |
| `timestamp` | unix s ou ISO | sim |
| `battery` | % | não |

Legado aceito: `temp` + `ts` em vez de `temperature` + `timestamp`.

## Variáveis de ambiente

```env
DATABASE_URL=postgresql://...
MQTT_BROKER_URL=mqtts://xxx.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_TOPIC_PREFIX=imut
LOG_LEVEL=info
```

## Executar

```bash
# na raiz do monorepo
pnpm install
pnpm --filter @imut/shared build
pnpm --filter @imut/mqtt-ingest prisma:generate

cp .env.example .env   # preencher MQTT + DATABASE_URL

pnpm --filter @imut/mqtt-ingest dev
```

## Regras aplicadas

- Dispositivo deve existir e estar `isActive`
- Assinatura `ACTIVE` ou `TRIALING`
- Intervalo mínimo entre leituras: **180s** (ESP32 envia a cada **240s**)
- `companyId` no tópico deve coincidir com o do dispositivo
- Atualiza `Device.lastSeenAt` e `status: ONLINE`

## Teste manual (mosquitto)

```bash
mosquitto_pub -h YOUR_CLUSTER.s1.eu.hivemq.cloud -p 8883 \
  --cafile /etc/ssl/certs/ca-certificates.crt \
  -u "$MQTT_USERNAME" -P "$MQTT_PASSWORD" \
  -t "imut/COMPANY_ID/DEVICE_ID/telemetry" \
  -m '{"deviceId":"DEVICE_ID","temperature":23.1,"humidity":60,"environment":"Estoque","timestamp":1716566400}'
```
