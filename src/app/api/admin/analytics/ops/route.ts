export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hotels, orders, agreements } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const [services, pending, activity] = await Promise.all([
    fetchServiceUsage(),
    fetchPendingOrders(),
    fetchRecentActivity(),
  ]);

  return NextResponse.json({ services, pendingOrders: pending, recentActivity: activity });
}

async function fetchServiceUsage() {
  const [cloudinary, dbSize, ordersThisMonth] = await Promise.allSettled([
    fetchCloudinary(),
    fetchDbSize(),
    fetchOrdersThisMonth(),
  ]);

  return {
    cloudinary: cloudinary.status === "fulfilled" ? cloudinary.value : null,
    database: dbSize.status === "fulfilled" ? dbSize.value : null,
    resend: ordersThisMonth.status === "fulfilled"
      ? {
          // Estimate: each paid order sends 2 emails (customer + fulfillment)
          mailsSentEstimate: Number(ordersThisMonth.value) * 2,
          monthlyLimit: 3000,
          dailyLimit: 100,
          plan: "free",
        }
      : null,
  };
}

async function fetchCloudinary() {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !apiKey || !apiSecret) return null;

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/usage`, {
    headers: { Authorization: `Basic ${auth}` },
    next: { revalidate: 300 }, // cache 5 min
  });
  if (!res.ok) throw new Error(`Cloudinary API: ${res.status}`);
  const data = await res.json();
  return {
    plan: data.plan as string,
    creditsUsed: Number(data.credits?.usage ?? 0),
    creditsLimit: Number(data.credits?.limit ?? 25),
    creditsUsedPct: Number(data.credits?.used_percent ?? 0),
    storageBytes: Number(data.storage?.usage ?? 0),
    bandwidthBytes: Number(data.bandwidth?.usage ?? 0),
    transformations: Number(data.transformations?.usage ?? 0),
    objects: Number(data.objects?.usage ?? 0),
  };
}

async function fetchDbSize() {
  const [row] = await db.execute<{ size_bytes: string }>(sql`
    SELECT pg_database_size(current_database())::bigint::text AS size_bytes
  `).then((r) => r.rows as Array<{ size_bytes: string }>);
  return {
    sizeBytes: Number(row?.size_bytes ?? 0),
    storageLimit: 0.5 * 1024 * 1024 * 1024, // 0.5 GB on Neon free
    plan: "free",
  };
}

async function fetchOrdersThisMonth() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({
      count: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} IN ('paid', 'printing', 'shipped'))`.as("count"),
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${startOfMonth}`);

  return Number(row?.count ?? 0);
}

async function fetchPendingOrders() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

  return db
    .select({
      id: orders.id,
      orderReference: orders.orderReference,
      customerEmail: orders.customerEmail,
      priceCents: orders.priceCents,
      createdAt: orders.createdAt,
      hotelName: hotels.name,
      hotelSlug: hotels.slug,
      stripePaymentIntentId: orders.stripePaymentIntentId,
    })
    .from(orders)
    .leftJoin(hotels, sql`${orders.hotelId} = ${hotels.id}`)
    .where(sql`${orders.status} = 'pending' AND ${orders.createdAt} < ${cutoff}`)
    .orderBy(sql`${orders.createdAt} ASC`)
    .limit(20);
}

async function fetchRecentActivity() {
  const result = await db.execute(sql`
    (
      SELECT
        'order'::text AS type,
        ${orders.id}::text AS id,
        COALESCE(${orders.orderReference}, 'Untitled')::text AS label,
        ${orders.status} AS status,
        ${hotels.name} AS hotel_name,
        ${orders.priceCents} AS price_cents,
        ${orders.format}::text AS format,
        ${orders.createdAt} AS created_at
      FROM ${orders}
      LEFT JOIN ${hotels} ON ${orders.hotelId} = ${hotels.id}
      ORDER BY ${orders.createdAt} DESC
      LIMIT 15
    )
    UNION ALL
    (
      SELECT
        'agreement'::text AS type,
        ${agreements.id}::text AS id,
        ${agreements.contractNr}::text AS label,
        ${agreements.status} AS status,
        ${hotels.name} AS hotel_name,
        NULL::int AS price_cents,
        NULL::text AS format,
        ${agreements.createdAt} AS created_at
      FROM ${agreements}
      LEFT JOIN ${hotels} ON ${agreements.hotelId} = ${hotels.id}
      ORDER BY ${agreements.createdAt} DESC
      LIMIT 10
    )
    UNION ALL
    (
      SELECT
        'hotel'::text AS type,
        ${hotels.id}::text AS id,
        ${hotels.name}::text AS label,
        CASE WHEN ${hotels.active} THEN 'active' ELSE 'inactive' END AS status,
        ${hotels.name} AS hotel_name,
        NULL::int AS price_cents,
        NULL::text AS format,
        ${hotels.createdAt} AS created_at
      FROM ${hotels}
      ORDER BY ${hotels.createdAt} DESC
      LIMIT 5
    )
    ORDER BY created_at DESC
    LIMIT 20
  `);

  return (result.rows as Array<{
    type: string;
    id: string;
    label: string;
    status: string;
    hotel_name: string | null;
    price_cents: number | null;
    format: string | null;
    created_at: string;
  }>).map((row) => ({
    type: row.type,
    id: row.id,
    label: row.label,
    status: row.status,
    hotelName: row.hotel_name,
    priceCents: row.price_cents,
    format: row.format,
    createdAt: row.created_at,
  }));
}
