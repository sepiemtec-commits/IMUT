import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const app = createApp();

app.listen(env.API_PORT, "0.0.0.0", () => {
  logger.info({ port: env.API_PORT, host: "0.0.0.0" }, "IMUT API listening");
});
