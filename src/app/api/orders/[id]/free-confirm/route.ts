export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendOrderEmails } from "@/lib/email";
import { FORMATS } from "@/lib/constants";

/**
 * POST /api/orders/[id]/free-confirm
 * Sends fulfillment emails for a free (promo-code) order that was already
 * marked as paid during creation. No payment verification needed.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;

  // Fetch order + hotel — must be status "paid" and priceCents 0
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      priceCents: orders.priceCents,
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
      emailsSent: orders.emailsSent,
      hotelName: hotels.name,
      hotelEmail: hotels.email,
      hotelCity: hotels.city,
    })
    .from(orders)
    .innerJoin(hotels, eq(orders.hotelId, hotels.id))
    .where(and(eq(orders.id, orderId), eq(orders.status, "paid")))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found or not free" }, { status: 404 });
  }

  if (order.emailsSent) {
    // Already sent — idempotent, just return success
    return NextResponse.json({ success: true, orderReference: order.orderReference });
  }

  const formatInfo = FORMATS[order.format as keyof typeof FORMATS];

  try {
    await sendOrderEmails({
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
      formatKey: (order.format === "large" ? "large" : "standard") as "standard" | "large",
      formatDimensions: formatInfo?.dimensions ?? "",
      hotelName: order.hotelName,
      hotelEmail: order.hotelEmail,
      hotelCity: order.hotelCity,
      commissionCents: 0,
      priceCents: 0,
    });

    await db
      .update(orders)
      .set({ emailsSent: true })
      .where(eq(orders.id, orderId));
  } catch (err) {
    console.error("Free order email failed:", err);
    // Don't block the redirect — emails failing shouldn't stop the user
  }

  return NextResponse.json({ success: true, orderReference: order.orderReference });
}
