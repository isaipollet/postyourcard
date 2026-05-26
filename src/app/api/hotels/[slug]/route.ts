import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
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

  return NextResponse.json(hotel);
}
