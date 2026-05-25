import type Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import {
  markSubscriptionPastDue,
  recordInvoicePayment,
  upsertSubscriptionFromStripe,
} from "./subscription.service.js";
import { getStripe } from "../lib/stripe.js";
import pino from "pino";

const logger = pino({ name: "stripe-webhook" });

async function companyIdFromCustomer(
  customerId: string,
): Promise<string | null> {
  const company = await prisma.company.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return company?.id ?? null;
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId =
        session.metadata?.companyId ??
        session.client_reference_id ??
        null;

      if (!companyId) {
        logger.warn({ sessionId: session.id }, "checkout sem companyId");
        break;
      }

      if (session.customer && typeof session.customer === "string") {
        await prisma.company.update({
          where: { id: companyId },
          data: { stripeCustomerId: session.customer },
        });
      }

      if (session.subscription && typeof session.subscription === "string") {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await upsertSubscriptionFromStripe(companyId, sub);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const companyId =
        sub.metadata?.companyId ??
        (await companyIdFromCustomer(
          typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        ));

      if (companyId) {
        await upsertSubscriptionFromStripe(companyId, sub);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const companyId = await companyIdFromCustomer(
        typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      );
      if (companyId) {
        await prisma.subscription.update({
          where: { companyId },
          data: {
            status: "CANCELED",
            canceledAt: new Date(),
            cancelAtPeriodEnd: false,
          },
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const companyId = await companyIdFromCustomer(
        typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer?.id ?? ""),
      );
      if (companyId) {
        await recordInvoicePayment(companyId, invoice);
        if (invoice.subscription && typeof invoice.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          await upsertSubscriptionFromStripe(companyId, sub);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const companyId = await companyIdFromCustomer(
        typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer?.id ?? ""),
      );
      if (companyId) {
        await markSubscriptionPastDue(companyId);
        logger.warn({ companyId, invoiceId: invoice.id }, "Pagamento falhou");
      }
      break;
    }

    default:
      logger.debug({ type: event.type }, "Evento Stripe ignorado");
  }
}
