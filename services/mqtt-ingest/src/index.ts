import mqtt, { type MqttClient } from "mqtt";
import { MQTT_TOPIC_PREFIX } from "@imut/shared";
import { env } from "./config/env.js";
import { handleTelemetryMessage } from "./handlers/telemetry.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const TELEMETRY_TOPIC = `${env.MQTT_TOPIC_PREFIX}/+/+/telemetry`;

function createMqttClient(): MqttClient {
  const url = new URL(env.MQTT_BROKER_URL);

  return mqtt.connect(env.MQTT_BROKER_URL, {
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
    protocol: url.protocol.replace(":", "") as "mqtt" | "mqtts" | "ws" | "wss",
    reconnectPeriod: 5000,
    connectTimeout: 30_000,
    keepalive: 60,
    clean: true,
    clientId: `imut-ingest-${process.pid}`,
  });
}

async function shutdown(client: MqttClient): Promise<void> {
  logger.info("Encerrando mqtt-ingest…");
  await new Promise<void>((resolve) => client.end(false, {}, () => resolve()));
  await prisma.$disconnect();
  process.exit(0);
}

async function main(): Promise<void> {
  await prisma.$connect();
  logger.info("PostgreSQL conectado");

  const client = createMqttClient();

  client.on("connect", () => {
    logger.info(
      { broker: env.MQTT_BROKER_URL, topic: TELEMETRY_TOPIC },
      "Conectado ao HiveMQ Cloud",
    );
    client.subscribe(TELEMETRY_TOPIC, { qos: 1 }, (err) => {
      if (err) {
        logger.fatal({ err }, "Falha ao subscrever tópico de telemetria");
        process.exit(1);
      }
    });
  });

  client.on("message", (topic, payload) => {
    void handleTelemetryMessage(topic, payload).catch((err) => {
      logger.error({ err, topic }, "Erro ao processar mensagem MQTT");
    });
  });

  client.on("reconnect", () => logger.warn("Reconectando ao broker MQTT…"));
  client.on("offline", () => logger.warn("Broker MQTT offline"));
  client.on("error", (err) => logger.error({ err }, "Erro MQTT"));

  process.on("SIGINT", () => void shutdown(client));
  process.on("SIGTERM", () => void shutdown(client));

  logger.info("IMUT mqtt-ingest em execução");
}

main().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});
