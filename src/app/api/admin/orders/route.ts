import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

  const validStatuses = [
    "pending",
    "paid",
    "printing",
    "shipped",
    "cancelled",
    "paid_print_failed",
  ];

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  try {
    const conditions = status
      ? sql`${orders.status} = ${status}`
      : sql`1=1`;

    const [orderRows, [countResult]] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderReference: orders.orderReference,
          hotelName: hotels.name,
          format: orders.format,
          status: orders.status,
          commissionStatus: orders.commissionStatus,
          priceCents: orders.priceCents,
          commissionCents: orders.commissionCents,
          recipientName: orders.recipientName,
          recipientCity: orders.recipientCity,
          recipientCountry: orders.recipientCountry,
          customerEmail: orders.customerEmail,
          emailsSent: orders.emailsSent,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .innerJoin(hotels, eq(orders.hotelId, hotels.id))
        .where(conditions)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(orders)
        .where(conditions),
    ]);

    return NextResponse.json({
      orders: orderRows,
      total: countResult.total,
    });
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
