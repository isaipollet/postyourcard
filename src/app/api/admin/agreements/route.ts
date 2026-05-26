import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agreements, agreementEvents, hotels } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  generateContractNr,
  getTemplate,
} from "@/lib/agreements/templates";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  hotelId: z.string().uuid(),
  templateKey: z.string().default("hotel_partner_v1"),
  variables: z.record(z.string(), z.string()),
});

export async function GET() {
  const rows = await db
    .select({
      id: agreements.id,
      contractNr: agreements.contractNr,
      status: agreements.status,
      templateKey: agreements.templateKey,
      hotelId: agreements.hotelId,
      hotelName: hotels.name,
      hotelEmail: hotels.email,
      sentAt: agreements.sentAt,
      signedByHotelAt: agreements.signedByHotelAt,
      completedAt: agreements.completedAt,
      createdAt: agreements.createdAt,
    })
    .from(agreements)
    .leftJoin(hotels, eq(agreements.hotelId, hotels.id))
    .orderBy(desc(agreements.createdAt));

  return NextResponse.json({ agreements: rows });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const template = getTemplate(parsed.data.templateKey);
  for (const v of template.variables) {
    if (v.required && !parsed.data.variables[v.key]?.trim()) {
      return NextResponse.json(
        { error: `Missing required variable: ${v.key}` },
        { status: 400 }
      );
    }
  }

  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.id, parsed.data.hotelId))
    .limit(1);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const contractNr = generateContractNr(hotel.name);

  const [created] = await db
    .insert(agreements)
    .values({
      hotelId: parsed.data.hotelId,
      templateKey: parsed.data.templateKey,
      contractNr,
      variables: parsed.data.variables,
      status: "draft",
    })
    .returning();

  await db.insert(agreementEvents).values({
    agreementId: created.id,
    type: "created",
    metadata: { templateKey: parsed.data.templateKey },
  });

  return NextResponse.json({ agreement: created });
}
