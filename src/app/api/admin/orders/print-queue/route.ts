export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: orders.id,
        orderReference: orders.orderReference,
        hotelName: hotels.name,
        hotelCity: hotels.city,
        format: orders.format,
        status: orders.status,
        priceCents: orders.priceCents,
        croppedImageUrl: orders.croppedImageUrl,
        cloudinaryPublicId: orders.cloudinaryPublicId,
        message: orders.message,
        recipientName: orders.recipientName,
        recipientStreet: orders.recipientStreet,
        recipientPostal: orders.recipientPostal,
        recipientCity: orders.recipientCity,
        recipientCountry: orders.recipientCountry,
        customerEmail: orders.customerEmail,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(hotels, eq(orders.hotelId, hotels.id))
      .where(sql`${orders.status} IN ('paid', 'printing')`)
      .orderBy(sql`${orders.createdAt} ASC`); // FIFO — oldest first

    return NextResponse.json({ orders: rows });
  } catch (err) {
    console.error("Failed to fetch print queue:", err);
    return NextResponse.json(
      { error: "Failed to fetch print queue" },
      { status: 500 }
    );
  }
}
