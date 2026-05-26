export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { and, inArray, isNotNull, lt, eq } from "drizzle-orm";
import { deleteImage } from "@/lib/cloudinary-server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const cleanupOrders = await db
    .select({
      id: orders.id,
      cloudinaryPublicId: orders.cloudinaryPublicId,
      orderReference: orders.orderReference,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, ["shipped", "cancelled"]),
        isNotNull(orders.cloudinaryPublicId),
        lt(orders.createdAt, twoDaysAgo)
      )
    )
    .limit(100);

  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const order of cleanupOrders) {
    try {
      await deleteImage(order.cloudinaryPublicId!);

      await db
        .update(orders)
        .set({ cloudinaryPublicId: null, croppedImageUrl: null })
        .where(eq(orders.id, order.id));

      deleted++;
    } catch (err) {
      failed++;
      errors.push(`${order.orderReference}: ${err}`);
    }
  }

  console.log(`[Cleanup] Deleted: ${deleted}, Failed: ${failed}`);

  return NextResponse.json({
    deleted,
    failed,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
