# MQTT — HiveMQ Cloud + IMUT Ingest

## Arquitetura

```
ESP32 --(MQTT TLS)--> HiveMQ Cloud --(subscribe)--> mqtt-ingest --(Prisma)--> PostgreSQL
```

Implementação: `services/mqtt-ingest` (MQTT.js + Node.js + TypeScript).

## Tópicos

Prefixo: `MQTT_TOPIC_PREFIX=imut` (padrão)

| Tópico | Direção | Descrição |
|--------|---------|-----------|
| `imut/{companyId}/{deviceId}/telemetry` | ESP32 → Cloud | Leitura a cada 4 min |
| `imut/{companyId}/{deviceId}/status` | ESP32 → Cloud | Online/offline (futuro) |

## Payload `telemetry`

```json
{
  "deviceId": "clxxxxxxxx",
  "temperature": 23.4,
  "humidity": 58.2,
  "environment": "Câmara fria",
  "timestamp": 1716566400,
  "battery": 92
}
```

- `temperature`: °C
- `humidity`: %
- `environment`: nome do ambiente monitorado
- `timestamp`: Unix segundos UTC ou ISO 8601
- `battery`: opcional

Formato legado: `temp` + `ts` (convertido automaticamente).

## Frequência

- Firmware: **4 minutos** (`240000 ms`)
- Servidor: ignora leituras com intervalo &lt; **180s** do último registro

## QoS

- QoS **1** (at least once)
- Sem retain em telemetria

## Fluxo no `mqtt-ingest`

1. Subscribe: `imut/+/+/telemetry`
2. Parse JSON + validação Zod (`@imut/shared`)
3. Busca `Device` por `deviceId`
4. Verifica assinatura ativa
5. `INSERT` em `SensorReading`
6. Atualiza `Device.lastSeenAt` e `status: ONLINE`

## HiveMQ Cloud

1. Criar cluster em [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud/)
2. Criar credenciais (username/password)
3. URL: `mqtts://<cluster>.s1.eu.hivemq.cloud:8883`
4. ACL: permitir publish em `imut/{companyId}/{deviceId}/telemetry` por credencial do device

## Executar o ingest

```bash
pnpm --filter @imut/mqtt-ingest dev
```

Ver também: [services/mqtt-ingest/README.md](../services/mqtt-ingest/README.md)
