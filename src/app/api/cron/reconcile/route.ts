export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { eq, lt, and, notInArray } from "drizzle-orm";
import { stripe } from "@/lib/stripe-server";
import { sendOrderEmails } from "@/lib/email";
import { FORMATS } from "@/lib/constants";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const issues: string[] = [];
  let checked = 0;
  let fixed = 0;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Find stale pending orders
  const staleOrders = await db
    .select({
      id: orders.id,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      orderReference: orders.orderReference,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.status, "pending"), lt(orders.createdAt, oneHourAgo)))
    .limit(100);

  for (const order of staleOrders) {
    checked++;

    if (!order.stripePaymentIntentId) {
      // Cancel orders without a PaymentIntent that are older than 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (order.createdAt && new Date(order.createdAt) < oneDayAgo) {
        await db
          .update(orders)
          .set({ status: "cancelled" })
          .where(eq(orders.id, order.id));
        issues.push(`${order.orderReference}: cancelled (no PI, stale)`);
        fixed++;
      }
      continue;
    }

    try {
      const pi = await stripe.paymentIntents.retrieve(
        order.stripePaymentIntentId
      );

      if (pi.status === "succeeded" && order.status === "pending") {
        await db
          .update(orders)
          .set({ status: "paid" })
          .where(eq(orders.id, order.id));
        issues.push(
          `${order.orderReference}: fixed — PI succeeded but order was pending (missed webhook)`
        );
        fixed++;
      } else if (pi.status === "canceled") {
        await db
          .update(orders)
          .set({ status: "cancelled" })
          .where(eq(orders.id, order.id));
        issues.push(`${order.orderReference}: cancelled (PI canceled)`);
        fixed++;
      }
    } catch (err) {
      console.error(`Reconcile PI check failed for ${order.orderReference}:`, err);
      issues.push(`${order.orderReference}: error checking PI`);
    }
  }

  // Orders with unsent emails — retry actual send
  const unsentEmailOrders = await db
    .select({
      id: orders.id,
      orderReference: orders.orderReference,
      format: orders.format,
      croppedImageUrl: orders.croppedImageUrl,
      recipientName: orders.recipientName,
      recipientStreet: orders.recipientStreet,
      recipientPostal: orders.recipientPostal,
      recipientCity: orders.recipientCity,
      recipientCountry: orders.recipientCountry,
      message: orders.message,
      customerEmail: orders.customerEmail,
      commissionCents: orders.commissionCents,
      priceCents: orders.priceCents,
      hotelName: hotels.name,
      hotelEmail: hotels.email,
      hotelCity: hotels.city,
      hotelLogoUrl: hotels.logoUrl,
    })
    .from(orders)
    .innerJoin(hotels, eq(orders.hotelId, hotels.id))
    .where(
      and(
        notInArray(orders.status, ["pending", "cancelled"]),
        eq(orders.emailsSent, false)
      )
    )
    .limit(50);

  for (const o of unsentEmailOrders) {
    const formatInfo = FORMATS[o.format as keyof typeof FORMATS];
    try {
      const sent = await sendOrderEmails({
        orderReference: o.orderReference!,
        customerEmail: o.customerEmail!,
        recipientName: o.recipientName!,
        recipientStreet: o.recipientStreet!,
        recipientPostal: o.recipientPostal!,
        recipientCity: o.recipientCity!,
        recipientCountry: o.recipientCountry!,
        message: o.message ?? "",
        croppedImageUrl: o.croppedImageUrl!,
        format: formatInfo?.name ?? o.format,
        formatKey: o.format as "standard" | "standard-v" | "large" | "large-v",
        formatDimensions: formatInfo?.dimensions ?? "",
        hotelName: o.hotelName,
        hotelEmail: o.hotelEmail,
        hotelCity: o.hotelCity,
        hotelLogoUrl: o.hotelLogoUrl,
        commissionCents: o.commissionCents,
        priceCents: o.priceCents,
      });

      if (sent.customer && sent.owner) {
        await db
          .update(orders)
          .set({ emailsSent: true })
          .where(eq(orders.id, o.id));
        issues.push(`${o.orderReference}: emails resent`);
        fixed++;
      } else {
        issues.push(
          `${o.orderReference}: partial resend (customer=${sent.customer}, owner=${sent.owner})`
        );
      }
    } catch (err) {
      console.error(`Email retry failed for ${o.orderReference}:`, err);
      issues.push(`${o.orderReference}: email retry threw`);
    }
  }

  console.log(
    `[Reconciliation] Checked: ${checked}, Fixed: ${fixed}, Issues: ${issues.length}`
  );

  return NextResponse.json({
    checked,
    fixed,
    issues,
    timestamp: new Date().toISOString(),
  });
}
