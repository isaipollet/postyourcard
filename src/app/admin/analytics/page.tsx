"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

interface AnalyticsData {
  global: {
    totalOrders: number;
    totalRevenueCents: number;
    totalCommissionCents: number;
    pendingOrders: number;
    cancelledOrders: number;
    activeHotels: number;
  };
  thisMonth: {
    orders: number;
    revenueCents: number;
    standardCount: number;
    panoramicCount: number;
  };
  lastMonth: {
    orders: number;
    revenueCents: number;
  };
  perHotel: Array<{
    hotelId: string;
    hotelName: string;
    hotelSlug: string;
    hotelCity: string | null;
    orderCount: number;
    standardCount: number;
    panoramicCount: number;
    revenueCents: number;
    commissionCents: number;
    avgOrderValueCents: number;
    lastOrderAt: string | null;
  }>;
  timeseries: Array<{ day: string; orders: number; revenueCents: number }>;
  formatBreakdown: Array<{ format: string; count: number; revenueCents: number }>;
  topCountries: Array<{ country: string; count: number }>;
  periodDays: number;
}

const FORMAT_LABELS: Record<string, { name: string; dimensions: string; emoji: string }> = {
  standard: { name: "Standard", dimensions: "105×148 mm", emoji: "📄" },
  large: { name: "Panoramic", dimensions: "99×210 mm", emoji: "🏞️" },
};

interface ActivityEvent {
  type: string;
  id: string;
  label: string;
  status: string;
  hotelName: string | null;
  priceCents: number | null;
  format: string | null;
  createdAt: string;
}

interface OpsData {
  services: {
    cloudinary: {
      plan: string;
      creditsUsed: number;
      creditsLimit: number;
      creditsUsedPct: number;
      storageBytes: number;
      bandwidthBytes: number;
      transformations: number;
      objects: number;
    } | null;
    database: {
      sizeBytes: number;
      storageLimit: number;
      plan: string;
    } | null;
    resend: {
      mailsSentEstimate: number;
      monthlyLimit: number;
      dailyLimit: number;
      plan: string;
    } | null;
  };
  pendingOrders: Array<{
    id: string;
    orderReference: string | null;
    customerEmail: string | null;
    priceCents: number;
    createdAt: string;
    hotelName: string | null;
    hotelSlug: string | null;
    stripePaymentIntentId: string | null;
  }>;
  recentActivity: ActivityEvent[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [ops, setOps] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${period}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    fetch("/api/admin/analytics/ops")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setOps)
      .catch(() => {
        // ops is non-critical — silently fail
      });
  }, []);

  const maxOrdersInDay = useMemo(() => {
    if (!data?.timeseries.length) return 1;
    return Math.max(...data.timeseries.map((d) => d.orders), 1);
  }, [data]);

  if (loading || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sand-600">
          <Spinner className="w-4 h-4" />
          <span>Loading analytics…</span>
        </div>
      </div>
    );
  }

  const g = data.global;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header + period selector */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-heading text-3xl font-medium text-gray-900">Analytics</h2>
          <p className="text-base text-sand-600">
            {data.perHotel.length} hotels · {g.activeHotels} active
          </p>
        </div>
        <div className="flex gap-1 bg-sand-100 rounded-xl p-1">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === d ? "bg-white text-teal shadow-sm" : "text-sand-600 hover:text-sand-800"
              }`}
            >
              {d === 365 ? "1y" : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Pending orders alert (only if any) */}
      {ops && ops.pendingOrders.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-heading text-lg font-medium text-amber-900">
                {ops.pendingOrders.length} pending order{ops.pendingOrders.length !== 1 ? "s" : ""} &gt; 24h
              </h3>
              <p className="text-sm text-amber-700">
                Webhook missed or payment stalled — investigate or cancel
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            {ops.pendingOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 text-sm bg-white/70 rounded-lg px-3 py-2 font-mono"
              >
                <span className="font-medium text-amber-900 flex-shrink-0">
                  {order.orderReference ?? order.id.slice(0, 8)}
                </span>
                <span className="text-amber-700/70 flex-1 truncate font-sans">
                  {order.hotelName} · {order.customerEmail}
                </span>
                <span className="text-amber-700/70 font-sans">
                  €{(order.priceCents / 100).toFixed(2)}
                </span>
                <span className="text-amber-600 font-sans text-xs">
                  {timeAgo(order.createdAt)}
                </span>
              </div>
            ))}
            {ops.pendingOrders.length > 5 && (
              <p className="text-xs text-amber-700 px-3 italic">
                + {ops.pendingOrders.length - 5} more in /admin/orders?status=pending
              </p>
            )}
          </div>
        </div>
      )}

      {/* Service usage gauges */}
      {ops && ops.services && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ServiceGauge
            label="Cloudinary"
            sublabel={ops.services.cloudinary?.plan ? `${ops.services.cloudinary.plan} plan · ${ops.services.cloudinary.objects} images` : "—"}
            used={ops.services.cloudinary?.creditsUsed ?? 0}
            limit={ops.services.cloudinary?.creditsLimit ?? 25}
            unit="credits"
            available={!!ops.services.cloudinary}
          />
          <ServiceGauge
            label="Resend (estimated)"
            sublabel="Mails this month · 2 per order"
            used={ops.services.resend?.mailsSentEstimate ?? 0}
            limit={ops.services.resend?.monthlyLimit ?? 3000}
            unit="mails"
            available={!!ops.services.resend}
          />
          <ServiceGauge
            label="Neon database"
            sublabel="Storage · free tier"
            used={ops.services.database ? ops.services.database.sizeBytes / 1024 / 1024 : 0}
            limit={ops.services.database ? ops.services.database.storageLimit / 1024 / 1024 : 512}
            unit="MB"
            available={!!ops.services.database}
            decimals={1}
          />
        </div>
      )}

      {/* This month vs last month */}
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-heading text-lg font-medium text-gray-800">
            This month
          </h3>
          {(() => {
            const delta = data.lastMonth.orders > 0
              ? ((data.thisMonth.orders - data.lastMonth.orders) / data.lastMonth.orders) * 100
              : null;
            if (delta === null) return null;
            const isUp = delta >= 0;
            return (
              <span className={`text-sm font-medium ${isUp ? "text-emerald-600" : "text-rose-600"}`}>
                {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}% vs last month
              </span>
            );
          })()}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">Orders</p>
            <p className="font-heading text-3xl font-medium text-gray-900 tabular-nums mt-1">
              {data.thisMonth.orders}
            </p>
            <p className="text-xs text-sand-500 mt-0.5">
              vs {data.lastMonth.orders} last
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">Revenue</p>
            <p className="font-heading text-3xl font-medium text-teal tabular-nums mt-1">
              €{(data.thisMonth.revenueCents / 100).toFixed(0)}
            </p>
            <p className="text-xs text-sand-500 mt-0.5">
              vs €{(data.lastMonth.revenueCents / 100).toFixed(0)} last
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">📄 Standard</p>
            <p className="font-heading text-3xl font-medium text-gray-900 tabular-nums mt-1">
              {data.thisMonth.standardCount}
            </p>
            <p className="text-xs text-sand-500 mt-0.5">
              {data.thisMonth.orders > 0 ? `${((data.thisMonth.standardCount / data.thisMonth.orders) * 100).toFixed(0)}% of orders` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">🏞️ Panoramic</p>
            <p className="font-heading text-3xl font-medium text-gray-900 tabular-nums mt-1">
              {data.thisMonth.panoramicCount}
            </p>
            <p className="text-xs text-sand-500 mt-0.5">
              {data.thisMonth.orders > 0 ? `${((data.thisMonth.panoramicCount / data.thisMonth.orders) * 100).toFixed(0)}% of orders` : "—"}
            </p>
          </div>
        </div>
      </Card>

      {/* Global stats (all time) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total revenue"
          value={`€${(g.totalRevenueCents / 100).toFixed(2)}`}
          accent="teal"
          sublabel={`${g.totalOrders} paid orders all time`}
        />
        <StatCard
          label="Hotel commission"
          value={`€${(g.totalCommissionCents / 100).toFixed(2)}`}
          accent="emerald"
          sublabel={`${g.totalOrders > 0 ? ((g.totalCommissionCents / g.totalRevenueCents) * 100).toFixed(0) : 0}% of revenue`}
        />
        <StatCard
          label="Pending"
          value={String(g.pendingOrders)}
          accent="amber"
          sublabel="awaiting payment"
        />
        <StatCard
          label="Cancelled / failed"
          value={String(g.cancelledOrders)}
          accent="rose"
          sublabel="not fulfilled"
        />
      </div>

      {/* Time series */}
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-heading text-lg font-medium text-gray-800">
            Orders per day
          </h3>
          <span className="text-xs text-sand-500 uppercase tracking-wide">
            Last {period} days
          </span>
        </div>
        {data.timeseries.length === 0 ? (
          <div className="py-12 text-center text-sand-500 text-sm italic">
            No orders yet in this period
          </div>
        ) : (
          <div className="h-40 flex items-end gap-px">
            {data.timeseries.map((point) => {
              const heightPct = (point.orders / maxOrdersInDay) * 100;
              return (
                <div
                  key={point.day}
                  className="flex-1 group relative flex flex-col justify-end"
                  title={`${point.day}: ${point.orders} order${point.orders !== 1 ? "s" : ""} · €${(point.revenueCents / 100).toFixed(2)}`}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className={`w-full min-h-[2px] rounded-t-sm ${
                      point.orders > 0 ? "bg-teal" : "bg-sand-200"
                    } group-hover:bg-teal-600 transition-colors`}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between mt-2 text-xs text-sand-500">
          <span>{data.timeseries[0]?.day ?? ""}</span>
          <span className="font-medium text-sand-700">
            Peak: {maxOrdersInDay} {maxOrdersInDay === 1 ? "order" : "orders"}
          </span>
          <span>{data.timeseries[data.timeseries.length - 1]?.day ?? ""}</span>
        </div>
      </Card>

      {/* Two-col: format + countries */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <h3 className="font-heading text-lg font-medium text-gray-800 mb-4">
            Postcard format
          </h3>
          {data.formatBreakdown.length === 0 ? (
            <p className="text-sm text-sand-500 italic">No data yet</p>
          ) : (
            <div className="space-y-4">
              {data.formatBreakdown.map((f) => {
                const totalCount = data.formatBreakdown.reduce((a, b) => a + b.count, 0);
                const pct = totalCount > 0 ? (f.count / totalCount) * 100 : 0;
                const meta = FORMAT_LABELS[f.format] ?? { name: f.format, dimensions: "", emoji: "•" };
                return (
                  <div key={f.format}>
                    <div className="flex items-baseline justify-between mb-1">
                      <div>
                        <span className="text-base font-medium text-gray-800">
                          {meta.emoji} {meta.name}
                        </span>
                        {meta.dimensions && (
                          <span className="text-xs text-sand-500 ml-2">{meta.dimensions}</span>
                        )}
                      </div>
                      <span className="text-sm text-sand-600 tabular-nums">
                        {f.count} · €{(f.revenueCents / 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 bg-sand-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-teal rounded-full"
                      />
                    </div>
                    <p className="text-xs text-sand-500 mt-1 tabular-nums">
                      {pct.toFixed(0)}% of all orders
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-medium text-gray-800 mb-4">
            Top destinations
          </h3>
          {data.topCountries.length === 0 ? (
            <p className="text-sm text-sand-500 italic">No data yet</p>
          ) : (
            <div className="space-y-2">
              {data.topCountries.slice(0, 6).map((c, idx) => {
                const max = data.topCountries[0].count;
                const pct = (c.count / max) * 100;
                return (
                  <div key={c.country} className="flex items-center gap-3">
                    <span className="w-5 text-sm font-medium text-sand-500 tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-base text-gray-800 truncate">
                      {c.country}
                    </span>
                    <div className="w-16 h-1.5 bg-sand-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="h-full bg-teal rounded-full"
                      />
                    </div>
                    <span className="text-sm text-sand-600 tabular-nums w-8 text-right">
                      {c.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      {ops && ops.recentActivity.length > 0 && (
        <Card>
          <h3 className="font-heading text-lg font-medium text-gray-800 mb-4">
            Recent activity
          </h3>
          <div className="space-y-2">
            {ops.recentActivity.slice(0, 12).map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className="flex items-center gap-3 py-1.5 border-b border-sand-100 last:border-0"
              >
                <ActivityIcon type={event.type} status={event.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {activityLabel(event.type)} · {event.label}
                    </span>
                    <span className="text-xs text-sand-500 capitalize flex-shrink-0">
                      {event.status}
                    </span>
                  </div>
                  {event.hotelName && (
                    <p className="text-xs text-sand-500 truncate">{event.hotelName}</p>
                  )}
                </div>
                {event.format && FORMAT_LABELS[event.format] && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sand-100 text-sand-700 flex-shrink-0">
                    {FORMAT_LABELS[event.format].emoji} {FORMAT_LABELS[event.format].name}
                  </span>
                )}
                {event.priceCents !== null && (
                  <span className="text-sm tabular-nums text-sand-600 flex-shrink-0">
                    €{(event.priceCents / 100).toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-sand-400 tabular-nums flex-shrink-0 w-14 text-right">
                  {timeAgo(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Per-hotel breakdown */}
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-heading text-lg font-medium text-gray-800">
            Per hotel
          </h3>
          <span className="text-xs text-sand-500 uppercase tracking-wide">
            All time · sorted by revenue
          </span>
        </div>
        {data.perHotel.length === 0 ? (
          <p className="text-sm text-sand-500 italic">No hotels yet</p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-sand-500 uppercase tracking-wide border-b border-sand-200">
                  <th className="px-5 py-2 text-left font-medium">Hotel</th>
                  <th className="px-3 py-2 text-right font-medium">Orders</th>
                  <th className="px-3 py-2 text-center font-medium">Format mix</th>
                  <th className="px-3 py-2 text-right font-medium">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium">Commission</th>
                  <th className="px-3 py-2 text-right font-medium">AOV</th>
                  <th className="px-5 py-2 text-right font-medium">Last order</th>
                </tr>
              </thead>
              <tbody>
                {data.perHotel.map((h) => (
                  <tr key={h.hotelId} className="border-b border-sand-100 hover:bg-sand-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{h.hotelName}</div>
                      {h.hotelCity && (
                        <div className="text-xs text-sand-500">{h.hotelCity}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-700">
                      {h.orderCount}
                    </td>
                    <td className="px-3 py-3">
                      <FormatMixBar standard={h.standardCount} panoramic={h.panoramicCount} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-gray-900">
                      €{(h.revenueCents / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-teal">
                      €{(h.commissionCents / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-sand-600">
                      {h.orderCount > 0 ? `€${(h.avgOrderValueCents / 100).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-sand-500">
                      {h.lastOrderAt
                        ? new Date(h.lastOrderAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent: "teal" | "emerald" | "amber" | "rose";
}) {
  const accentMap = {
    teal: "text-teal",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">{label}</p>
      <p className={`font-heading text-2xl font-medium tabular-nums mt-1 ${accentMap[accent]}`}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-sand-500 mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-5 shadow-sm">{children}</div>
  );
}

function ServiceGauge({
  label,
  sublabel,
  used,
  limit,
  unit,
  available,
  decimals = 0,
}: {
  label: string;
  sublabel: string;
  used: number;
  limit: number;
  unit: string;
  available: boolean;
  decimals?: number;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const status: "ok" | "warn" | "critical" =
    pct >= 90 ? "critical" : pct >= 70 ? "warn" : "ok";
  const colorMap = {
    ok: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    warn: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    critical: { bar: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
  };
  const c = colorMap[status];

  if (!available) {
    return (
      <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm opacity-50">
        <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">{label}</p>
        <p className="text-sand-500 italic text-sm mt-2">Service unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">{label}</p>
        <span className={`text-xs font-medium ${c.text} tabular-nums`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <p className="font-heading text-xl font-medium tabular-nums mt-1 text-gray-900">
        {used.toFixed(decimals)} <span className="text-sm text-sand-500 font-normal">/ {limit.toFixed(decimals)} {unit}</span>
      </p>
      <div className={`h-1.5 rounded-full mt-2 overflow-hidden ${c.bg}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${c.bar}`}
        />
      </div>
      <p className="text-xs text-sand-500 mt-2 truncate">{sublabel}</p>
    </div>
  );
}

function FormatMixBar({ standard, panoramic }: { standard: number; panoramic: number }) {
  const total = standard + panoramic;
  if (total === 0) return <span className="text-xs text-sand-400">—</span>;
  const stdPct = (standard / total) * 100;
  const panPct = (panoramic / total) * 100;
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-20 h-2 bg-sand-100 rounded-full overflow-hidden flex">
        <div className="bg-teal" style={{ width: `${stdPct}%` }} title={`Standard: ${standard}`} />
        <div className="bg-amber-400" style={{ width: `${panPct}%` }} title={`Panoramic: ${panoramic}`} />
      </div>
      <span className="text-xs text-sand-600 tabular-nums whitespace-nowrap">
        {stdPct.toFixed(0)}/{panPct.toFixed(0)}
      </span>
    </div>
  );
}

function ActivityIcon({ type, status }: { type: string; status: string }) {
  const config: Record<string, { bg: string; text: string; emoji: string }> = {
    order: {
      bg: status === "shipped" ? "bg-emerald-100" : status === "paid" ? "bg-teal/10" : status === "cancelled" ? "bg-rose-100" : "bg-amber-100",
      text: status === "shipped" ? "text-emerald-700" : status === "paid" ? "text-teal" : status === "cancelled" ? "text-rose-700" : "text-amber-700",
      emoji: "📮",
    },
    agreement: {
      bg: "bg-violet-100",
      text: "text-violet-700",
      emoji: "📜",
    },
    hotel: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      emoji: "🏨",
    },
  };
  const c = config[type] ?? { bg: "bg-sand-100", text: "text-sand-700", emoji: "•" };
  return (
    <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center text-sm flex-shrink-0`}>
      {c.emoji}
    </div>
  );
}

function activityLabel(type: string): string {
  switch (type) {
    case "order":
      return "Order";
    case "agreement":
      return "Agreement";
    case "hotel":
      return "Hotel added";
    default:
      return type;
  }
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}
