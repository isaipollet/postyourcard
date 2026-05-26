import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe-server";

export async function GET() {
  try {
    const result = await db
      .select({
        id: hotels.id,
        name: hotels.name,
        slug: hotels.slug,
        email: hotels.email,
        logoUrl: hotels.logoUrl,
        heroImageUrl: hotels.heroImageUrl,
        city: hotels.city,
        website: hotels.website,
        contactPerson: hotels.contactPerson,
        contactPhone: hotels.contactPhone,
        welcomeMessage: hotels.welcomeMessage,
        address: hotels.address,
        defaultLanguage: hotels.defaultLanguage,
        qrPlacement: hotels.qrPlacement,
        tags: hotels.tags,
        active: hotels.active,
        stripeAccountId: hotels.stripeAccountId,
        stripeOnboardingComplete: hotels.stripeOnboardingComplete,
        commissionPct: hotels.commissionPct,
        createdAt: hotels.createdAt,
        orderCount: sql<number>`count(${orders.id})::int`,
        totalCommissionCents: sql<number>`coalesce(sum(${orders.commissionCents}) filter (where ${orders.status} not in ('pending', 'cancelled')), 0)::int`,
      })
      .from(hotels)
      .leftJoin(orders, eq(orders.hotelId, hotels.id))
      .groupBy(hotels.id)
      .orderBy(hotels.name);

    return NextResponse.json(
      result.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        email: h.email,
        logoUrl: h.logoUrl,
        heroImageUrl: h.heroImageUrl,
        city: h.city,
        website: h.website,
        contactPerson: h.contactPerson,
        contactPhone: h.contactPhone,
        welcomeMessage: h.welcomeMessage,
        address: h.address,
        defaultLanguage: h.defaultLanguage,
        qrPlacement: h.qrPlacement,
        tags: h.tags,
        active: h.active,
        stripeAccountId: h.stripeAccountId,
        stripeOnboarded: h.stripeOnboardingComplete,
        orderCount: h.orderCount,
        commissionEarned: (h.totalCommissionCents || 0) / 100,
      }))
    );
  } catch (err) {
    console.error("Failed to fetch hotels:", err);
    return NextResponse.json(
      { error: "Failed to fetch hotels" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  let slug = body.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!slug) {
    slug = `hotel-${Date.now()}`;
  }

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: hotels.id })
    .from(hotels)
    .where(eq(hotels.slug, slug))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "A hotel with this name already exists. Try a different name." },
      { status: 409 }
    );
  }

  // Create Stripe Express account for the hotel
  let stripeAccountId: string | null = null;
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "BE",
      email: body.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "company",
      metadata: { hotel_slug: slug },
    });
    stripeAccountId = account.id;
  } catch (err) {
    console.error("Stripe account creation failed:", err);
  }

  try {
    const [hotel] = await db
      .insert(hotels)
      .values({
        name: body.name.trim(),
        slug,
        email: body.email.trim(),
        logoUrl: body.logoUrl || null,
        heroImageUrl: body.heroImageUrl || null,
        city: body.city?.trim() || null,
        website: body.website?.trim() || null,
        contactPerson: body.contactPerson?.trim() || null,
        contactPhone: body.contactPhone?.trim() || null,
        welcomeMessage: body.welcomeMessage?.trim() || null,
        address: body.address?.trim() || null,
        defaultLanguage: body.defaultLanguage || "en",
        qrPlacement: body.qrPlacement?.trim() || null,
        tags: body.tags?.trim() || null,
        stripeAccountId,
        stripeOnboardingComplete: false,
      })
      .returning({
        id: hotels.id,
        name: hotels.name,
        slug: hotels.slug,
        email: hotels.email,
      });

    return NextResponse.json(hotel, { status: 201 });
  } catch (err) {
    console.error("Failed to create hotel:", err);
    return NextResponse.json(
      { error: "Failed to create hotel" },
      { status: 500 }
    );
  }
}
