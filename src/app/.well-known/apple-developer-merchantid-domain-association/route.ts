/**
 * Serves the Apple Pay domain verification file required by Stripe.
 * Stripe fetches this file to verify that postyourcard.com is a valid
 * Apple Pay merchant domain.
 *
 * The file content is fetched live from Stripe so it stays up to date.
 * See: https://stripe.com/docs/stripe-js/elements/payment-request-button#verifying-your-domain-with-apple-pay
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.stripe.com/v1/apple_pay/domains/files/apple-developer-merchantid-domain-association",
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return new Response("Not found", { status: 404 });
    }

    const text = await res.text();
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
