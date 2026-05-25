import Stripe from "stripe";
import { env, isStripeConfigured } from "../config/env.js";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return client;
}
