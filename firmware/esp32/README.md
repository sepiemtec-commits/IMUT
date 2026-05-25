# Firmware ESP32 — IMUT

## Intervalo

Enviar telemetria a cada **4 minutos**:

```c
#define MEASUREMENT_INTERVAL_MS (4 * 60 * 1000)
```

## Tópico MQTT

```
imut/{companyId}/{deviceId}/telemetry
```

`companyId` e `deviceId` vêm do cadastro na API IMUT.

## Payload JSON

```json
{
  "deviceId": "DEVICE_ID",
  "temperature": 22.5,
  "humidity": 65.0,
  "environment": "Câmara fria",
  "timestamp": 1716566400
}
```

Use `time(nullptr)` para `timestamp` (UTC, segundos).

## Exemplo Arduino (PubSubClient)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define INTERVAL_MS (240000UL)

const char* topic = "imut/COMPANY_ID/DEVICE_ID/telemetry";

void publishReading(float temp, float hum) {
  char payload[256];
  snprintf(payload, sizeof(payload),
    "{\"deviceId\":\"%s\",\"temperature\":%.1f,\"humidity\":%.1f,"
    "\"environment\":\"%s\",\"timestamp\":%lu}",
    DEVICE_ID, temp, hum, ENVIRONMENT, (unsigned long)time(nullptr));
  client.publish(topic, payload, false); // QoS 0 no client; broker QoS1 se configurado
}

void loop() {
  static unsigned long last = 0;
  if (millis() - last >= INTERVAL_MS) {
    last = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    publishReading(t, h);
  }
  client.loop();
}
```

## HiveMQ

- Broker: `mqtts://....hivemq.cloud:8883`
- Usuário/senha gerados ao cadastrar o `Device` na API
