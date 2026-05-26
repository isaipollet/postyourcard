import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe-server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const [result] = await db
    .select({
      id: orders.id,
      commissionStatus: orders.commissionStatus,
      commissionCents: orders.commissionCents,
      orderReference: orders.orderReference,
      hotelStripeAccountId: hotels.stripeAccountId,
      hotelStripeOnboarded: hotels.stripeOnboardingComplete,
      hotelName: hotels.name,
    })
    .from(orders)
    .innerJoin(hotels, eq(orders.hotelId, hotels.id))
    .where(eq(orders.id, params.id))
    .limit(1);

  if (!result) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (result.commissionStatus !== "held") {
    return NextResponse.json(
      { error: `Commission status is "${result.commissionStatus}", not "held"` },
      { status: 400 }
    );
  }

  if (!result.hotelStripeAccountId || !result.hotelStripeOnboarded) {
    return NextResponse.json(
      { error: `Hotel "${result.hotelName}" has not completed Stripe onboarding yet` },
      { status: 400 }
    );
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: result.commissionCents,
      currency: "eur",
      destination: result.hotelStripeAccountId,
      transfer_group: result.orderReference!,
      metadata: {
        order_id: result.id,
        order_reference: result.orderReference!,
        hotel_name: result.hotelName,
      },
    });

    await db
      .update(orders)
      .set({ commissionStatus: "manually_paid" })
      .where(eq(orders.id, result.id));

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amount: result.commissionCents,
    });
  } catch (err) {
    console.error("Commission transfer failed:", err);
    return NextResponse.json(
      { error: "Transfer failed. Please try again or check Stripe dashboard." },
      { status: 500 }
    );
  }
}
