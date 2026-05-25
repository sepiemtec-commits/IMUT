import { describe, expect, it } from "vitest";
import {
  parseTelemetryPayload,
  telemetryTimestampToDate,
} from "@imut/shared";

describe("parseTelemetryPayload", () => {
  it("aceita payload canônico", () => {
    const data = parseTelemetryPayload({
      deviceId: "dev1",
      temperature: 22.5,
      humidity: 60,
      environment: "Estoque",
      timestamp: 1716566400,
    });
    expect(data.temperature).toBe(22.5);
    expect(data.deviceId).toBe("dev1");
  });

  it("aceita payload legado temp/ts", () => {
    const data = parseTelemetryPayload({
      deviceId: "dev1",
      temp: 20,
      humidity: 55,
      environment: "Sala",
      ts: 1716566400,
    });
    expect(data.temperature).toBe(20);
    expect(data.timestamp).toBe(1716566400);
  });
});

describe("telemetryTimestampToDate", () => {
  it("converte unix seconds", () => {
    const d = telemetryTimestampToDate(1716566400);
    expect(d.toISOString()).toBe("2024-05-24T16:00:00.000Z");
  });

  it("converte ISO string", () => {
    const d = telemetryTimestampToDate("2024-05-24T16:00:00.000Z");
    expect(d.getUTCFullYear()).toBe(2024);
  });
});
