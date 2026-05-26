"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import StatusStepper from "@/components/ui/StatusStepper";
import { hapticSuccess, hapticTap } from "@/lib/haptics";

interface Order {
  id: string;
  orderReference: string;
  hotelName: string;
  format: string;
  status: string;
  commissionStatus: string;
  priceCents: number;
  commissionCents: number;
  recipientName: string;
  recipientCity: string;
  recipientCountry: string;
  customerEmail: string;
  emailsSent: boolean;
  createdAt: string;
}

const STATUS_BAR_COLOR: Record<string, string> = {
  pending: "bg-slate-300",
  paid: "bg-blue-400",
  printing: "bg-amber-400",
  shipped: "bg-emerald-400",
  cancelled: "bg-rose-300",
  paid_print_failed: "bg-red-400",
};

const FILTER_OPTIONS = [
  { value: "", label: "All", icon: null },
  { value: "paid", label: "Paid", icon: "bg-blue-400" },
  { value: "printing", label: "Printing", icon: "bg-amber-400" },
  { value: "shipped", label: "Shipped", icon: "bg-green-400" },
  { value: "paid_print_failed", label: "Failed", icon: "bg-red-400" },
  { value: "cancelled", label: "Cancelled", icon: "bg-gray-400" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === 0) return;
    const dist = Math.max(0, e.touches[0].clientY - touchStartY.current);
    setPullDistance(Math.min(dist * 0.4, 80));
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 50) {
      setRefreshing(true);
      hapticTap();
      await fetchOrders();
      setRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  };

  const transferCommission = async (orderId: string) => {
    setActionLoading(orderId);
    hapticTap();
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/transfer-commission`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      const data = await res.json();
      hapticSuccess();
      toast.success(
        `Commission transferred: €${(data.amount / 100).toFixed(2)}`
      );
      await fetchOrders();
    } catch (err) {
      toast.error(`Transfer failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (
    orderId: string,
    status: "printing" | "shipped" | "cancelled"
  ) => {
    setActionLoading(orderId);
    hapticTap();
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      hapticSuccess();
      toast.success(`Marked as ${status}`);
      await fetchOrders();
    } catch (err) {
      toast.error(
        `Status update failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const nextStatus = (status: string): "printing" | "shipped" | null => {
    if (status === "paid" || status === "paid_print_failed") return "printing";
    if (status === "printing") return "shipped";
    return null;
  };

  const needsAttention = (order: Order) =>
    order.status === "paid_print_failed" ||
    order.commissionStatus === "held" ||
    (!order.emailsSent && order.status !== "pending");

  return (
    <div
      ref={containerRef}
      className="max-w-5xl mx-auto px-4 py-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex justify-center overflow-hidden transition-all"
        style={{ height: pullDistance > 0 || refreshing ? `${Math.max(pullDistance, refreshing ? 40 : 0)}px` : 0 }}
      >
        {refreshing ? (
          <Spinner className="w-5 h-5 text-teal" />
        ) : pullDistance > 50 ? (
          <span className="text-xs text-teal font-medium">Release to refresh</span>
        ) : pullDistance > 0 ? (
          <span className="text-xs text-sand-500">Pull to refresh</span>
        ) : null}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-3xl font-medium text-gray-900">
            Orders
          </h2>
          <p className="text-base text-sand-600">{total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.value}
            onClick={() => { hapticTap(); setStatusFilter(f.value); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              statusFilter === f.value
                ? "bg-teal text-white shadow-sm shadow-teal/20"
                : "bg-white border border-sand-200 text-sand-700 hover:border-sand-300"
            }`}
          >
            {f.icon && (
              <span className={`w-2 h-2 rounded-full ${statusFilter === f.value ? "bg-white/60" : f.icon}`} />
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-sand-200 p-5 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-sand-100 rounded" />
                  <div className="h-5 w-28 bg-sand-200 rounded" />
                </div>
                <div className="h-6 w-16 bg-sand-100 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sand-100">
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-sand-200 rounded" />
                  <div className="h-2.5 w-16 bg-sand-100 rounded" />
                </div>
                <div className="space-y-1 items-end flex flex-col">
                  <div className="h-4 w-14 bg-sand-200 rounded" />
                  <div className="h-2.5 w-20 bg-sand-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-sand-100 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-sand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-gray-800 text-lg mb-1">No orders found</h3>
          <p className="text-sand-600 text-base mb-5">
            {statusFilter
              ? "Try a different filter to see more orders."
              : "Orders will appear here once customers start ordering."}
          </p>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter("")}
              className="px-4 py-2 rounded-xl border-2 border-sand-200 text-sand-700 text-base font-medium
                hover:border-teal hover:text-teal transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <motion.div className="space-y-4" layout>
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className={`group bg-white rounded-2xl shadow-sm border border-sand-200 p-0 overflow-hidden
                  hover:shadow-md transition-all active:scale-[0.995]
                  ${needsAttention(order) ? "ring-1 ring-amber-200 bg-amber-50/30" : ""}`}
              >
                <div className="flex">
                  {/* Vertical status marker */}
                  <div className={`w-1 flex-shrink-0 ${
                    STATUS_BAR_COLOR[order.status] || "bg-slate-300"
                  } group-hover:w-1.5 transition-all`} />

                  <div className="flex-1 p-5">
                    {/* Header: ref + status */}
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className="font-mono text-xs font-bold text-sand-400 tracking-tight">
                            #{order.orderReference}
                          </span>
                          <Badge variant={order.status}>
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <h3 className="font-heading font-medium text-gray-900 leading-tight truncate">
                          {order.hotelName}
                        </h3>
                        <p className="text-base text-sand-500 mt-0.5">
                          {order.recipientName} &middot; {order.recipientCity}, {order.recipientCountry}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-teal tabular-nums">
                          &euro;{(order.priceCents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs font-medium text-sand-600 uppercase tracking-tight tabular-nums">
                          Comm: &euro;{(order.commissionCents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Alert badges */}
                    {(order.commissionStatus === "held" || (!order.emailsSent && order.status !== "pending")) && (
                      <div className="flex items-center gap-1.5 mb-3">
                        {order.commissionStatus === "held" && (
                          <Badge variant="held">Commission held</Badge>
                        )}
                        {!order.emailsSent && order.status !== "pending" && (
                          <Badge variant="error">Emails pending</Badge>
                        )}
                      </div>
                    )}

                    {/* Status stepper */}
                    {order.status !== "pending" && order.status !== "cancelled" && (
                      <div className="mb-3">
                        <StatusStepper status={order.status} />
                      </div>
                    )}

                    {/* Footer: date */}
                    <div className="flex items-center justify-between border-t border-sand-50 pt-3">
                      <p className="text-xs text-sand-600">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {(needsAttention(order) || nextStatus(order.status)) && (
                  <div className="flex items-center flex-wrap gap-2 px-5 pb-4 pt-3 border-t border-sand-100">
                    {order.commissionStatus === "held" && (
                      <button
                        onClick={() => transferCommission(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium
                          hover:bg-amber-100 active:scale-[0.97] transition-all disabled:opacity-50"
                      >
                        {actionLoading === order.id ? (
                          <Spinner className="w-3 h-3" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                          </svg>
                        )}
                        Transfer commission
                      </button>
                    )}
                    {nextStatus(order.status) && (
                      <button
                        onClick={() =>
                          updateStatus(order.id, nextStatus(order.status)!)
                        }
                        disabled={actionLoading === order.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal/10 text-teal text-xs font-medium
                          hover:bg-teal/15 active:scale-[0.97] transition-all disabled:opacity-50"
                      >
                        {actionLoading === order.id ? (
                          <Spinner className="w-3 h-3" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Mark {nextStatus(order.status)}
                      </button>
                    )}
                    {(order.status === "paid" ||
                      order.status === "printing" ||
                      order.status === "paid_print_failed") && (
                      <button
                        onClick={() => updateStatus(order.id, "cancelled")}
                        disabled={actionLoading === order.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium
                          hover:bg-rose-100 active:scale-[0.97] transition-all disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
