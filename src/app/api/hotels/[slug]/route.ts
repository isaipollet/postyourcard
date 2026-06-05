import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import { hotels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  noStore(); // prevent Next.js from caching the Neon HTTP fetch
  const [hotel] = await db
    .select({
      name: hotels.name,
      logoUrl: hotels.logoUrl,
      heroImageUrl: hotels.heroImageUrl,
      city: hotels.city,
      website: hotels.website,
      welcomeMessage: hotels.welcomeMessage,
      defaultLanguage: hotels.defaultLanguage,
    })
    .from(hotels)
    .where(and(eq(hotels.slug, params.slug), eq(hotels.active, true)))
    .limit(1);

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  return NextResponse.json(hotel, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Netlify-CDN-Cache-Control": "no-store",
    },
  });
}
