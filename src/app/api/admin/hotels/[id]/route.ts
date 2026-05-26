export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hotels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const UpdateHotelSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    logoUrl: z.string().nullable().optional(),
    heroImageUrl: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    contactPerson: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
    welcomeMessage: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    defaultLanguage: z.string().optional(),
    qrPlacement: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    active: z.boolean().optional(),
    commissionPct: z.union([z.string(), z.number()]).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateHotelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const updates: Record<string, unknown> = {};
  const textFields = [
    "logoUrl", "heroImageUrl", "city", "name", "email",
    "website", "contactPerson", "contactPhone", "welcomeMessage",
    "address", "defaultLanguage", "qrPlacement", "tags",
  ] as const;
  for (const field of textFields) {
    if (input[field] !== undefined) {
      updates[field] = typeof input[field] === "string" ? input[field].trim() || null : null;
    }
  }
  if (input.active !== undefined) updates.active = input.active;
  if (input.commissionPct !== undefined) updates.commissionPct = String(input.commissionPct);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const [hotel] = await db
      .update(hotels)
      .set(updates)
      .where(eq(hotels.id, params.id))
      .returning({ id: hotels.id, name: hotels.name, slug: hotels.slug });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json(hotel);
  } catch (err) {
    console.error("Failed to update hotel:", err);
    return NextResponse.json({ error: "Failed to update hotel" }, { status: 500 });
  }
}
