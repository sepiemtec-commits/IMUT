import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requirePermission } from "../middleware/require-permission.js";
import { asyncHandler } from "../lib/async-handler.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../lib/prisma.js";
import { sanitizeCsvField, escapeXml } from "../utils/sanitize.js";

export const devicesRouter = Router();

devicesRouter.use(authenticate);
devicesRouter.use(requireActiveSubscription);

const MAX_DEVICES = 10;

const createDeviceSchema = z.object({
  name: z.string().min(2).max(80),
  environment: z.string().min(2).max(100),
  serialNumber: z.string().max(64).optional(),
  mqttPassword: z.string().min(8).max(64),
  tempMaxCelsius: z.number().min(-40).max(125).optional().default(30),
  humidityMaxPercent: z.number().min(0).max(100).optional().default(80),
  alertAfterCycles: z.number().int().min(1).max(10).optional().default(2),
});

const updateDeviceSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  environment: z.string().min(2).max(100).optional(),
  serialNumber: z.string().max(64).optional(),
  tempMaxCelsius: z.number().min(-40).max(125).optional(),
  humidityMaxPercent: z.number().min(0).max(100).optional(),
  alertAfterCycles: z.number().int().min(1).max(10).optional(),
});

function mapDevice(d: {
  id: string;
  name: string;
  environment: string;
  serialNumber: string | null;
  mqttUsername: string;
  status: string;
  isActive: boolean;
  lastSeenAt: Date | null;
  tempMaxCelsius: number;
  humidityMaxPercent: number;
  alertAfterCycles: number;
  createdAt: Date;
  sensorReadings?: Array<{ temperature: number; humidity: number; recordedAt: Date }>;
}) {
  return {
    id: d.id,
    name: d.name,
    environment: d.environment,
    serialNumber: d.serialNumber,
    mqttUsername: d.mqttUsername,
    status: d.status,
    isActive: d.isActive,
    lastSeenAt: d.lastSeenAt,
    tempMaxCelsius: d.tempMaxCelsius,
    humidityMaxPercent: d.humidityMaxPercent,
    alertAfterCycles: d.alertAfterCycles,
    createdAt: d.createdAt,
    latestReading: d.sensorReadings?.[0]
      ? {
          temperature: d.sensorReadings[0].temperature,
          humidity: d.sensorReadings[0].humidity,
          recordedAt: d.sensorReadings[0].recordedAt,
        }
      : null,
  };
}

// GET /devices
devicesRouter.get("/", requirePermission("devices:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const devices = await prisma.device.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
    include: { sensorReadings: { orderBy: { recordedAt: "desc" }, take: 1 } },
  });
  res.json({ devices: devices.map(mapDevice) });
}));

// GET /devices/:id
devicesRouter.get("/:id", requirePermission("devices:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const device = await prisma.device.findFirst({
    where: { id: (req.params.id as string), companyId, isActive: true },
    include: { sensorReadings: { orderBy: { recordedAt: "desc" }, take: 1 } },
  });
  if (!device) return res.status(404).json({ message: "Dispositivo não encontrado" });
  res.json({ device: mapDevice(device) });
}));

// POST /devices
devicesRouter.post("/", requirePermission("devices:write"), validateBody(createDeviceSchema), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;

  const count = await prisma.device.count({ where: { companyId, isActive: true } });
  if (count >= MAX_DEVICES) {
    return res.status(422).json({ message: `Limite de ${MAX_DEVICES} dispositivos atingido` });
  }

  const { name, environment, serialNumber, mqttPassword, tempMaxCelsius, humidityMaxPercent, alertAfterCycles } = req.body as z.infer<typeof createDeviceSchema>;

  // mqttUsername = <companyId_prefix>_<slug>
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
  const mqttUsername = `${companyId.slice(0, 8)}_${slug}_${Date.now().toString(36)}`;
  const mqttPasswordHash = await bcrypt.hash(mqttPassword, 10);

  const device = await prisma.device.create({
    data: {
      companyId,
      name,
      environment,
      serialNumber,
      mqttUsername,
      mqttPasswordHash,
      tempMaxCelsius: tempMaxCelsius ?? 30,
      humidityMaxPercent: humidityMaxPercent ?? 80,
      alertAfterCycles: alertAfterCycles ?? 2,
    },
    include: { sensorReadings: { take: 1 } },
  });

  res.status(201).json({
    device: mapDevice(device),
    mqttCredentials: {
      broker: process.env.MQTT_BROKER_URL ?? "mqtts://seu-cluster.hivemq.cloud:8883",
      username: mqttUsername,
      password: mqttPassword,
      topic: `imut/${companyId}/${device.id}/telemetry`,
    },
  });
}));

// PATCH /devices/:id
devicesRouter.patch("/:id", requirePermission("devices:write"), validateBody(updateDeviceSchema), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const existing = await prisma.device.findFirst({ where: { id: (req.params.id as string), companyId, isActive: true } });
  if (!existing) return res.status(404).json({ message: "Dispositivo não encontrado" });

  const data = req.body as z.infer<typeof updateDeviceSchema>;
  const device = await prisma.device.update({
    where: { id: (req.params.id as string) },
    data,
    include: { sensorReadings: { orderBy: { recordedAt: "desc" }, take: 1 } },
  });

  res.json({ device: mapDevice(device) });
}));

// DELETE /devices/:id
devicesRouter.delete("/:id", requirePermission("devices:write"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const existing = await prisma.device.findFirst({ where: { id: (req.params.id as string), companyId, isActive: true } });
  if (!existing) return res.status(404).json({ message: "Dispositivo não encontrado" });

  await prisma.device.update({ where: { id: (req.params.id as string) }, data: { isActive: false } });
  res.status(204).send();
}));

// GET /devices/:id/readings/export?format=csv&hours=168
devicesRouter.get("/:id/readings/export", requirePermission("devices:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const device = await prisma.device.findFirst({ where: { id: (req.params.id as string), companyId, isActive: true } });
  if (!device) return res.status(404).json({ message: "Dispositivo não encontrado" });

  const hours = Math.min(Number(req.query.hours ?? 168), 8760); // max 1 ano
  const since = new Date(Date.now() - hours * 3_600_000);
  const format = req.query.format === "xlsx" ? "xlsx" : "csv";

  const readings = await prisma.sensorReading.findMany({
    where: { deviceId: device.id, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
    select: { recordedAt: true, temperature: true, humidity: true, battery: true, environment: true },
  });

  const filename = `${device.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}`;

  if (format === "csv") {
    const header = "Data/Hora,Temperatura (°C),Umidade (%),Bateria (%),Ambiente";
    const rows = readings.map((r) =>
      [
        new Date(r.recordedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        r.temperature.toFixed(2),
        r.humidity.toFixed(2),
        r.battery != null ? r.battery.toString() : "",
        sanitizeCsvField(r.environment), // ← protege contra CSV Injection
      ].join(","),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
    res.send("\uFEFF" + [header, ...rows].join("\n")); // BOM para Excel reconhecer UTF-8
  } else {
    // XLSX via XML (SpreadsheetML) — com escape de entidades XML
    const xmlRows = [
      `<Row>
        <Cell><Data ss:Type="String">Data/Hora</Data></Cell>
        <Cell><Data ss:Type="String">Temperatura (°C)</Data></Cell>
        <Cell><Data ss:Type="String">Umidade (%)</Data></Cell>
        <Cell><Data ss:Type="String">Bateria (%)</Data></Cell>
        <Cell><Data ss:Type="String">Ambiente</Data></Cell>
      </Row>`,
      ...readings.map((r) => `<Row>
        <Cell><Data ss:Type="String">${escapeXml(new Date(r.recordedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }))}</Data></Cell>
        <Cell><Data ss:Type="Number">${r.temperature.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${r.humidity.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="${r.battery != null ? "Number" : "String"}">${r.battery != null ? r.battery : ""}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(r.environment)}</Data></Cell>
      </Row>`),
    ].join("\n");

    const xlsx = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Leituras">
    <Table>${xmlRows}</Table>
  </Worksheet>
</Workbook>`;

    res.setHeader("Content-Type", "application/vnd.ms-excel");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.xls"`);
    res.send(xlsx);
  }
}));
