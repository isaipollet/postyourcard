export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe-server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const [hotel] = await db
    .select({ id: hotels.id, stripeAccountId: hotels.stripeAccountId })
    .from(hotels)
    .where(eq(hotels.id, params.id))
    .limit(1);

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  if (!hotel.stripeAccountId) {
    return NextResponse.json(
      { error: "Hotel has no Stripe account" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const accountLink = await stripe.accountLinks.create({
    account: hotel.stripeAccountId,
    refresh_url: `${baseUrl}/admin`,
    return_url: `${baseUrl}/admin?onboarded=${hotel.id}`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
