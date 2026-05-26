import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe-server";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendOrderEmails } from "@/lib/email";
import { FORMATS } from "@/lib/constants";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSucceeded(paymentIntent);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await handleChargeRefunded(charge);
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await handleAccountUpdated(account);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    console.error("No order_id in PaymentIntent metadata:", paymentIntent.id);
    return;
  }

  // Fetch order with hotel info
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      format: orders.format,
      croppedImageUrl: orders.croppedImageUrl,
      recipientName: orders.recipientName,
      recipientStreet: orders.recipientStreet,
      recipientCity: orders.recipientCity,
      recipientPostal: orders.recipientPostal,
      recipientCountry: orders.recipientCountry,
      message: orders.message,
      orderReference: orders.orderReference,
      customerEmail: orders.customerEmail,
      commissionCents: orders.commissionCents,
      priceCents: orders.priceCents,
      hotelName: hotels.name,
      hotelEmail: hotels.email,
      hotelCity: hotels.city,
    })
    .from(orders)
    .innerJoin(hotels, eq(orders.hotelId, hotels.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    console.error("Order not found for PI:", paymentIntent.id);
    return;
  }

  // Idempotency check
  if (order.status !== "pending") {
    return;
  }

  // Verify payment amount matches expected price
  if (paymentIntent.amount !== order.priceCents) {
    console.error(
      `Payment amount mismatch for order ${orderId}: expected ${order.priceCents}, got ${paymentIntent.amount}`
    );
    return;
  }

  // Atomically update status from pending to paid (prevents race conditions from duplicate webhooks)
  const [updated] = await db
    .update(orders)
    .set({ status: "paid" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });

  if (!updated) {
    // Another webhook already processed this order
    return;
  }

  // Send fulfillment email — owner prints + ships manually
  const formatInfo = FORMATS[order.format as keyof typeof FORMATS];
  try {
    const sent = await sendOrderEmails({
      orderReference: order.orderReference!,
      customerEmail: order.customerEmail!,
      recipientName: order.recipientName!,
      recipientStreet: order.recipientStreet!,
      recipientPostal: order.recipientPostal!,
      recipientCity: order.recipientCity!,
      recipientCountry: order.recipientCountry!,
      message: order.message ?? "",
      croppedImageUrl: order.croppedImageUrl!,
      format: formatInfo?.name ?? order.format,
      formatDimensions: formatInfo?.dimensions ?? "",
      hotelName: order.hotelName,
      hotelEmail: order.hotelEmail,
      hotelCity: order.hotelCity,
      commissionCents: order.commissionCents,
      priceCents: order.priceCents,
    });

    if (sent.customer && sent.owner) {
      await db
        .update(orders)
        .set({ emailsSent: true })
        .where(eq(orders.id, orderId));
    }
  } catch (err) {
    console.error("Email sending failed for order:", orderId, err);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(eq(orders.stripePaymentIntentId, paymentIntentId));
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) return;

  await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(eq(orders.id, orderId));
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (account.charges_enabled && account.payouts_enabled) {
    await db
      .update(hotels)
      .set({ stripeOnboardingComplete: true })
      .where(eq(hotels.stripeAccountId, account.id));
  }
}
