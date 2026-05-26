import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agreements, agreementEvents, hotels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendSigningLink } from "@/lib/agreements/email";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const [agreement] = await db
    .select()
    .from(agreements)
    .where(eq(agreements.id, params.id))
    .limit(1);
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (agreement.status !== "draft" && agreement.status !== "sent") {
    return NextResponse.json(
      { error: `Cannot send: status is ${agreement.status}` },
      { status: 400 }
    );
  }

  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.id, agreement.hotelId))
    .limit(1);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const variables = agreement.variables as Record<string, string>;
  const hotelEmail = variables.hotel_email || hotel.email;

  const baseUrl = getBaseUrl(req);
  const signUrl = `${baseUrl}/sign/${agreement.signToken}`;

  await sendSigningLink({
    hotelEmail,
    hotelName: hotel.name,
    contractNr: agreement.contractNr,
    signUrl,
  });

  await db
    .update(agreements)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(agreements.id, agreement.id));

  await db.insert(agreementEvents).values({
    agreementId: agreement.id,
    type: "sent",
    metadata: { to: hotelEmail },
  });

  return NextResponse.json({ ok: true, signUrl });
}

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
