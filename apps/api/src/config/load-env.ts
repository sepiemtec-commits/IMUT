import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Carrega .env da raiz do monorepo ou de apps/api (antes do Zod). */
export function loadEnvFiles(): void {
  const moduleDir =
    typeof __dirname !== "undefined"
      ? __dirname
      : dirname(fileURLToPath(import.meta.url));

  const candidates = [
    resolve(moduleDir, "../../.env"),
    resolve(moduleDir, "../../../../.env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
  ];

  const seen = new Set<string>();
  for (const path of candidates) {
    const normalized = resolve(path);
    if (!seen.has(normalized) && existsSync(normalized)) {
      seen.add(normalized);
      config({ path: normalized });
    }
  }
}
