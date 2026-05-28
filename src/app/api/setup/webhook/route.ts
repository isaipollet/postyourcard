export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";

// ONE-TIME USE: Creates the Stripe webhook and returns the signing secret.
// DELETE THIS FILE after copying the whsec_ secret to Netlify.
export async function GET() {
  try {
    const webhook = await stripe.webhookEndpoints.create({
      url: "https://postyourcard.com/api/webhooks/stripe",
      enabled_events: [
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "charge.refunded",
      ],
    });

    return NextResponse.json({
      success: true,
      webhook_id: webhook.id,
      signing_secret: webhook.secret,
      message: "Copy the signing_secret, add it to Netlify as STRIPE_WEBHOOK_SECRET, then delete this file.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
