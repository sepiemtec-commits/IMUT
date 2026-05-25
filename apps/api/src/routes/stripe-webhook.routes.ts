import { Router, type Request, type Response } from "express";
import { env, isStripeConfigured } from "../config/env.js";
import { getStripe } from "../lib/stripe.js";
import { handleStripeEvent } from "../services/stripe-webhook.service.js";
import pino from "pino";

const logger = pino({ name: "stripe-webhook-route" });

export const stripeWebhookRouter = Router();

stripeWebhookRouter.post("/", async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "MISSING_SIGNATURE" });
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    logger.warn({ err }, "Assinatura webhook inválida");
    return res.status(400).json({ error: "INVALID_SIGNATURE" });
  }

  try {
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    logger.error({ err, type: event.type }, "Erro ao processar webhook");
    res.status(500).json({ error: "WEBHOOK_HANDLER_FAILED" });
  }
});
