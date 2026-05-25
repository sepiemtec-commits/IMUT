import {
  PaymentStatus,
  SubscriptionStatus as PrismaSubscriptionStatus,
} from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "../lib/prisma.js";

const ACTIVE_STATUSES: PrismaSubscriptionStatus[] = [
  PrismaSubscriptionStatus.ACTIVE,
  PrismaSubscriptionStatus.TRIALING,
];

/** Bloqueia inadimplentes: apenas ACTIVE e TRIALING com período válido */
export function isSubscriptionActive(
  status: PrismaSubscriptionStatus,
  currentPeriodEnd: Date | null | undefined,
): boolean {
  if (!ACTIVE_STATUSES.includes(status)) return false;
  if (!currentPeriodEnd) return true;
  return currentPeriodEnd > new Date();
}

export function mapStripeSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status,
): PrismaSubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "unpaid":
      return "UNPAID";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "INCOMPLETE";
  }
}

export async function upsertSubscriptionFromStripe(
  companyId: string,
  stripeSub: Stripe.Subscription,
): Promise<void> {
  const status = mapStripeSubscriptionStatus(stripeSub.status);
  const priceId = stripeSub.items.data[0]?.price?.id ?? null;

  await prisma.subscription.upsert({
    where: { companyId },
    create: {
      companyId,
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: priceId,
      status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      canceledAt: stripeSub.canceled_at
        ? new Date(stripeSub.canceled_at * 1000)
        : null,
    },
    update: {
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: priceId,
      status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      canceledAt: stripeSub.canceled_at
        ? new Date(stripeSub.canceled_at * 1000)
        : null,
    },
  });
}

export async function recordInvoicePayment(
  companyId: string,
  invoice: Stripe.Invoice,
): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { companyId } });
  if (!sub) return;

  const amountCents = invoice.amount_paid ?? 0;
  if (amountCents <= 0) return;

  await prisma.payment.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      companyId,
      subscriptionId: sub.id,
      stripeInvoiceId: invoice.id,
      amountCents,
      currency: invoice.currency ?? "brl",
      status: PaymentStatus.SUCCEEDED,
      description: invoice.description ?? "Assinatura mensal IMUT",
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
    },
    update: {
      status: PaymentStatus.SUCCEEDED,
      paidAt: new Date(),
    },
  });
}

export async function markSubscriptionPastDue(companyId: string): Promise<void> {
  await prisma.subscription.updateMany({
    where: { companyId },
    data: { status: "PAST_DUE" },
  });
}
