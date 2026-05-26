export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const BodySchema = z.object({
  status: z.enum(["printing", "shipped", "cancelled"]),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  paid: ["printing", "shipped", "cancelled"],
  printing: ["shipped", "cancelled"],
  shipped: [],
  cancelled: [],
  pending: ["cancelled"],
  paid_print_failed: ["printing", "shipped", "cancelled"],
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [order] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, params.id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json(
      {
        error: `Cannot transition from ${order.status} to ${parsed.data.status}`,
      },
      { status: 400 }
    );
  }

  await db
    .update(orders)
    .set({ status: parsed.data.status })
    .where(eq(orders.id, params.id));

  return NextResponse.json({ ok: true, status: parsed.data.status });
}
