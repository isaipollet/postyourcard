import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  agreements,
  agreementEvents,
  agreementSignatures,
  hotels,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
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

  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.id, agreement.hotelId))
    .limit(1);

  const signatures = await db
    .select()
    .from(agreementSignatures)
    .where(eq(agreementSignatures.agreementId, agreement.id))
    .orderBy(asc(agreementSignatures.signedAt));

  const events = await db
    .select()
    .from(agreementEvents)
    .where(eq(agreementEvents.agreementId, agreement.id))
    .orderBy(asc(agreementEvents.createdAt));

  return NextResponse.json({ agreement, hotel, signatures, events });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const [existing] = await db
    .select()
    .from(agreements)
    .where(eq(agreements.id, params.id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status === "completed") {
    return NextResponse.json(
      { error: "Cannot delete a completed agreement" },
      { status: 400 }
    );
  }
  await db.delete(agreements).where(eq(agreements.id, params.id));
  return NextResponse.json({ ok: true });
}
