import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels, orders } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30", 10), 1), 365);

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const [
      [globals],
      [thisMonth],
      [lastMonth],
      perHotel,
      timeseries,
      formatBreakdown,
      topCountries,
    ] = await Promise.all([
      db
        .select({
          totalOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped'))`.as("total_orders"),
          totalRevenueCents: sql<number>`COALESCE(SUM(${orders.priceCents}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped')), 0)`.as("total_revenue"),
          totalCommissionCents: sql<number>`COALESCE(SUM(${orders.commissionCents}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped')), 0)`.as("total_commission"),
          pendingOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'pending')`.as("pending_orders"),
          cancelledOrders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('cancelled', 'paid_print_failed'))`.as("cancelled_orders"),
          activeHotels: sql<number>`(SELECT COUNT(*) FROM ${hotels} WHERE ${hotels.active} = true)`.as("active_hotels"),
        })
        .from(orders),

      db
        .select({
          orders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped'))`.as("orders"),
          revenueCents: sql<number>`COALESCE(SUM(${orders.priceCents}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped')), 0)`.as("revenue"),
          standardCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped') AND ${orders.format} = 'standard')`.as("std_count"),
          panoramicCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped') AND ${orders.format} = 'large')`.as("pan_count"),
        })
        .from(orders)
        .where(sql`${orders.createdAt} >= ${startOfMonth}`),

      db
        .select({
          orders: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped'))`.as("orders"),
          revenueCents: sql<number>`COALESCE(SUM(${orders.priceCents}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped')), 0)`.as("revenue"),
        })
        .from(orders)
        .where(sql`${orders.createdAt} >= ${startOfLastMonth} AND ${orders.createdAt} < ${startOfMonth}`),

      db
        .select({
          hotelId: hotels.id,
          hotelName: hotels.name,
          hotelSlug: hotels.slug,
          hotelCity: hotels.city,
          orderCount: sql<number>`COUNT(${orders.id}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped'))`.as("order_count"),
          standardCount: sql<number>`COUNT(${orders.id}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped') AND ${orders.format} = 'standard')`.as("standard_count"),
          panoramicCount: sql<number>`COUNT(${orders.id}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped') AND ${orders.format} = 'large')`.as("panoramic_count"),
          revenueCents: sql<number>`COALESCE(SUM(${orders.priceCents}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped')), 0)`.as("revenue"),
          commissionCents: sql<number>`COALESCE(SUM(${orders.commissionCents}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped')), 0)`.as("commission"),
          lastOrderAt: sql<string | null>`MAX(${orders.createdAt})`.as("last_order_at"),
        })
        .from(hotels)
        .leftJoin(orders, sql`${orders.hotelId} = ${hotels.id}`)
        .groupBy(hotels.id, hotels.name, hotels.slug, hotels.city)
        .orderBy(sql`revenue DESC`),

      (async () => {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return db.execute(sql`
          SELECT
            DATE_TRUNC('day', ${orders.createdAt})::date AS day,
            COUNT(*) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped'))::int AS orders,
            COALESCE(SUM(${orders.priceCents}) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped')), 0)::int AS revenue
          FROM ${orders}
          WHERE ${orders.createdAt} >= ${since}
          GROUP BY day
          ORDER BY day ASC
        `);
      })(),

      db
        .select({
          format: orders.format,
          count: sql<number>`COUNT(*)`.as("count"),
          revenueCents: sql<number>`COALESCE(SUM(${orders.priceCents}), 0)`.as("revenue"),
        })
        .from(orders)
        .where(sql`${orders.status} IN ('paid', 'printing', 'shipped')`)
        .groupBy(orders.format),

      db
        .select({
          country: orders.recipientCountry,
          count: sql<number>`COUNT(*)`.as("count"),
        })
        .from(orders)
        .where(sql`${orders.status} IN ('paid', 'printing', 'shipped') AND ${orders.recipientCountry} IS NOT NULL`)
        .groupBy(orders.recipientCountry)
        .orderBy(sql`count DESC`)
        .limit(10),
    ]);

    return NextResponse.json({
      global: {
        totalOrders: Number(globals.totalOrders),
        totalRevenueCents: Number(globals.totalRevenueCents),
        totalCommissionCents: Number(globals.totalCommissionCents),
        pendingOrders: Number(globals.pendingOrders),
        cancelledOrders: Number(globals.cancelledOrders),
        activeHotels: Number(globals.activeHotels),
      },
      thisMonth: {
        orders: Number(thisMonth.orders),
        revenueCents: Number(thisMonth.revenueCents),
        standardCount: Number(thisMonth.standardCount),
        panoramicCount: Number(thisMonth.panoramicCount),
      },
      lastMonth: {
        orders: Number(lastMonth.orders),
        revenueCents: Number(lastMonth.revenueCents),
      },
      perHotel: perHotel.map((h) => ({
        hotelId: h.hotelId,
        hotelName: h.hotelName,
        hotelSlug: h.hotelSlug,
        hotelCity: h.hotelCity,
        orderCount: Number(h.orderCount),
        standardCount: Number(h.standardCount),
        panoramicCount: Number(h.panoramicCount),
        revenueCents: Number(h.revenueCents),
        commissionCents: Number(h.commissionCents),
        avgOrderValueCents: Number(h.orderCount) > 0 ? Math.round(Number(h.revenueCents) / Number(h.orderCount)) : 0,
        lastOrderAt: h.lastOrderAt,
      })),
      timeseries: (timeseries.rows as Array<{ day: string; orders: number; revenue: number }>).map((row) => ({
        day: row.day,
        orders: row.orders,
        revenueCents: row.revenue,
      })),
      formatBreakdown: formatBreakdown.map((f) => ({
        format: f.format,
        count: Number(f.count),
        revenueCents: Number(f.revenueCents),
      })),
      topCountries: topCountries.map((c) => ({
        country: c.country,
        count: Number(c.count),
      })),
      periodDays: days,
    });
  } catch (error) {
    console.error("Analytics query failed:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
