export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe-server";
import { rateLimit } from "@/lib/rate-limit";

const CreateOrderSchema = z.object({
  hotelSlug: z.string().min(1),
  format: z.enum(["standard", "standard-v", "large", "large-v"]),
  cloudinaryPublicId: z.string().min(1),
  croppedImageUrl: z.string().min(1),
  message: z.string().min(1).max(300),
  customerEmail: z.string().email(),
  promoCode: z.string().optional(),
  address: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
  }),
});

import { PRICE_CENTS } from "@/lib/constants";

export async function POST(request: Request) {
  // Rate limit: 10 orders per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const { success } = rateLimit(`orders:${ip}`, {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Look up hotel
  const [hotel] = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      email: hotels.email,
      stripeAccountId: hotels.stripeAccountId,
      stripeOnboardingComplete: hotels.stripeOnboardingComplete,
      commissionPct: hotels.commissionPct,
      active: hotels.active,
    })
    .from(hotels)
    .where(eq(hotels.slug, input.hotelSlug))
    .limit(1);

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  if (!hotel.active) {
    return NextResponse.json({ error: "Hotel is not active" }, { status: 403 });
  }

  // Calculate commission based on hotel-specific percentage
  const commissionPct = parseFloat(hotel.commissionPct || "0.20");
  const commissionCents = Math.round(PRICE_CENTS * commissionPct);

  // Generate order reference
  const orderReference = `PYC-${Date.now().toString(36).toUpperCase()}`;

  // Create order
  const [order] = await db
    .insert(orders)
    .values({
      hotelId: hotel.id,
      format: input.format,
      priceCents: PRICE_CENTS,
      cloudinaryPublicId: input.cloudinaryPublicId,
      croppedImageUrl: input.croppedImageUrl,
      message: input.message,
      customerEmail: input.customerEmail,
      recipientName: input.address.name,
      recipientStreet: input.address.street,
      recipientPostal: input.address.postalCode,
      recipientCity: input.address.city,
      recipientCountry: input.address.country,
      orderReference,
      commissionCents,
      commissionStatus: hotel.stripeOnboardingComplete ? "pending" : "held",
      status: "pending",
    })
    .returning({ id: orders.id });

  if (!order) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }

  // ── Free promo code bypass ──────────────────────────────────────────────
  const ownerCode = process.env.OWNER_PROMO_CODE;
  const isFree =
    ownerCode &&
    ownerCode.length > 0 &&
    input.promoCode?.trim().toUpperCase() === ownerCode.trim().toUpperCase();

  if (isFree) {
    // Mark order as paid immediately — no Stripe needed
    await db
      .update(orders)
      .set({ status: "paid", priceCents: 0, commissionCents: 0 })
      .where(eq(orders.id, order.id));

    return NextResponse.json({ isFree: true, orderId: order.id, orderReference });
  }
  // ────────────────────────────────────────────────────────────────────────

  // Create Stripe PaymentIntent
  try {
    const params: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount: PRICE_CENTS,
      currency: "eur",
      automatic_payment_methods: { enabled: true, allow_redirects: "always" },
      metadata: {
        order_id: order.id,
        order_reference: orderReference,
        hotel_slug: input.hotelSlug,
      },
    };

    // If hotel is onboarded on Stripe Connect, add automatic transfer
    if (hotel.stripeAccountId && hotel.stripeOnboardingComplete) {
      params.transfer_data = {
        destination: hotel.stripeAccountId,
        amount: commissionCents,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(params);

    // Update order with Stripe PI id
    await db
      .update(orders)
      .set({ stripePaymentIntentId: paymentIntent.id })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      orderReference,
    });
  } catch (err) {
    console.error("Stripe PaymentIntent creation failed:", err);

    // Clean up the order
    await db.delete(orders).where(eq(orders.id, order.id));

    return NextResponse.json(
      { error: "Payment setup failed" },
      { status: 500 }
    );
  }
}
