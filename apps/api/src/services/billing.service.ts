import { env, isStripeConfigured } from "../config/env.js";
import { getStripe } from "../lib/stripe.js";
import { prisma } from "../lib/prisma.js";

export async function createCheckoutSession(
  companyId: string,
  userEmail: string,
): Promise<{ url: string; sessionId: string }> {
  if (!isStripeConfigured()) {
    throw Object.assign(new Error("Stripe não configurado"), { code: "STRIPE_NOT_CONFIGURED" });
  }

  const stripe = getStripe();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: true },
  });

  if (!company) {
    throw Object.assign(new Error("Empresa não encontrada"), { code: "NOT_FOUND" });
  }

  let customerId = company.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: company.name,
      metadata: { companyId },
    });
    customerId = customer.id;
    await prisma.company.update({
      where: { id: companyId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: companyId,
    line_items: [
      {
        price: env.STRIPE_PRICE_ID_MONTHLY!,
        quantity: 1,
      },
    ],
    metadata: { companyId },
    subscription_data: {
      metadata: { companyId },
    },
    success_url: `${env.APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/subscription/cancel`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error("Stripe não retornou URL de checkout");
  }

  return { url: session.url, sessionId: session.id };
}

export async function createBillingPortalSession(
  companyId: string,
): Promise<{ url: string }> {
  if (!isStripeConfigured()) {
    throw Object.assign(new Error("Stripe não configurado"), { code: "STRIPE_NOT_CONFIGURED" });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company?.stripeCustomerId) {
    throw Object.assign(new Error("Cliente Stripe não encontrado"), {
      code: "NO_STRIPE_CUSTOMER",
    });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${env.APP_URL}/settings/billing`,
  });

  return { url: session.url };
}
