"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";
import { hapticSuccess, hapticTap } from "@/lib/haptics";

interface PrintOrder {
  id: string;
  orderReference: string | null;
  hotelName: string;
  hotelCity: string | null;
  format: string;
  status: string;
  priceCents: number;
  croppedImageUrl: string | null;
  cloudinaryPublicId: string | null;
  message: string | null;
  recipientName: string | null;
  recipientStreet: string | null;
  recipientPostal: string | null;
  recipientCity: string | null;
  recipientCountry: string | null;
  customerEmail: string | null;
  createdAt: string;
}

const FORMAT_LABELS: Record<string, { name: string; dimensions: string; emoji: string }> = {
  standard:    { name: "Standard (H)",         dimensions: "148×105 mm", emoji: "📄" },
  "standard-v": { name: "Standard (V)",         dimensions: "105×148 mm", emoji: "📄" },
  large:       { name: "Panoramic (H)",        dimensions: "210×99 mm",  emoji: "🏞️" },
  "large-v":   { name: "Panoramic (V)",        dimensions: "99×210 mm",  emoji: "🏞️" },
};

// For filtering: "standard" family covers standard + standard-v, "large" covers large + large-v
function matchesFormatFilter(orderFormat: string, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "standard") return orderFormat === "standard" || orderFormat === "standard-v";
  if (filter === "large") return orderFormat === "large" || orderFormat === "large-v";
  return orderFormat === filter;
}

export default function PrintQueuePage() {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);
  const [formatFilter, setFormatFilter] = useState<"all" | "standard" | "large">("all");
  const [todayOnly, setTodayOnly] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/print-queue");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
    } catch {
      toast.error("Failed to load print queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const updateStatus = async (
    orderId: string,
    status: "printing" | "shipped" | "cancelled"
  ) => {
    setActionLoadingId(orderId);
    hapticTap();
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      hapticSuccess();
      const labelMap = {
        printing: "Marked as printing",
        shipped: "Marked as shipped 🚀",
        cancelled: "Cancelled",
      };
      toast.success(labelMap[status]);
      await fetchQueue();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const sendBatchToPrinter = async () => {
    const queuedCount = orders.filter((o) => o.status === "paid").length;
    if (queuedCount === 0) {
      toast.error("No new cards to batch");
      return;
    }
    if (!confirm(`Send ${queuedCount} card${queuedCount !== 1 ? "s" : ""} to the printer as one batch?`)) {
      return;
    }
    setBatchSending(true);
    hapticTap();
    try {
      const res = await fetch("/api/admin/orders/print-batch", { method: "POST" });
      if (!res.ok) throw new Error();
      const result = await res.json();
      hapticSuccess();
      if (result.sent > 0) {
        toast.success(
          `Batch ${result.batchRef}: ${result.sent} card${result.sent !== 1 ? "s" : ""} emailed to ${result.recipient}`
        );
      } else {
        toast.error("Batch sent nothing — check the queue");
      }
      if (result.skipped?.length) {
        toast.warning(`${result.skipped.length} order(s) skipped — they stay queued`);
      }
      await fetchQueue();
    } catch {
      toast.error("Failed to send batch to printer");
    } finally {
      setBatchSending(false);
    }
  };

  const filtered = useMemo(() => {
    let out = orders;
    if (formatFilter !== "all") {
      out = out.filter((o) => matchesFormatFilter(o.format, formatFilter));
    }
    if (todayOnly) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      out = out.filter((o) => new Date(o.createdAt) >= startOfDay);
    }
    return out;
  }, [orders, formatFilter, todayOnly]);

  const stats = useMemo(() => {
    const standardCount = orders.filter((o) => matchesFormatFilter(o.format, "standard")).length;
    const panoramicCount = orders.filter((o) => matchesFormatFilter(o.format, "large")).length;
    return { total: orders.length, standardCount, panoramicCount };
  }, [orders]);

  /**
   * Build a Cloudinary download URL with fl_attachment so the browser saves
   * the file to disk (Content-Disposition: attachment) instead of opening a tab.
   * Inserts the transformation right after /upload/ in the CDN URL.
   */
  const buildDownloadUrl = (cloudinaryUrl: string, filename: string): string => {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    return cloudinaryUrl.replace("/upload/", `/upload/fl_attachment:${safeFilename}/`);
  };

  const downloadAllPhotos = () => {
    if (filtered.length === 0) {
      toast.error("Nothing to download");
      return;
    }
    hapticTap();
    let count = 0;
    filtered.forEach((order, idx) => {
      if (!order.croppedImageUrl) return;
      const filename = `${order.orderReference ?? order.id.slice(0, 8)}-${order.format}.jpg`;
      const downloadUrl = buildDownloadUrl(order.croppedImageUrl, filename);
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename; // works when same-origin; Cloudinary fl_attachment handles CDN downloads
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 400); // stagger to avoid browser throttling
      count++;
    });
    toast.success(`Downloading ${count} photo${count !== 1 ? "s" : ""}…`);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sand-600">
          <Spinner className="w-4 h-4" />
          <span>Loading print queue…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-heading text-3xl font-medium text-gray-900">
            Print queue
          </h2>
          <p className="text-base text-sand-600">
            {stats.total} {stats.total === 1 ? "card" : "cards"} to print
            {stats.total > 0 && (
              <> · {stats.standardCount} 📄 Standard · {stats.panoramicCount} 🏞️ Panoramic</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchQueue}
            className="px-3 py-2 rounded-xl border border-sand-200 text-sand-700 text-sm font-medium hover:border-sand-300 transition-colors flex items-center gap-1.5"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
          <button
            onClick={sendBatchToPrinter}
            disabled={batchSending || orders.filter((o) => o.status === "paid").length === 0}
            className="px-4 py-2 rounded-xl bg-burgundy text-white text-sm font-medium hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 flex items-center gap-1.5"
            style={{ backgroundColor: "#6B1F2A" }}
          >
            {batchSending ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
            Send batch to printer ({orders.filter((o) => o.status === "paid").length})
          </button>
          <button
            onClick={downloadAllPhotos}
            disabled={filtered.length === 0}
            className="px-4 py-2 rounded-xl bg-teal text-white text-sm font-medium hover:bg-teal-600 active:scale-[0.97] transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Download all photos
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-sand-100 rounded-xl p-1">
          {(["all", "standard", "large"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormatFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                formatFilter === f ? "bg-white text-teal shadow-sm" : "text-sand-600 hover:text-sand-800"
              }`}
            >
              {f === "all" ? "All formats" : FORMAT_LABELS[f]?.name ?? f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setTodayOnly(!todayOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            todayOnly ? "bg-teal text-white" : "bg-sand-100 text-sand-700 hover:bg-sand-200"
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full border-2 ${todayOnly ? "bg-white border-white" : "border-sand-400"}`} />
          Today only
        </button>
        {filtered.length !== orders.length && (
          <span className="text-sm text-sand-600">
            Showing {filtered.length} of {orders.length}
          </span>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-gray-800 text-lg mb-1">
            {orders.length === 0 ? "Queue is empty" : "Nothing matches the filter"}
          </h3>
          <p className="text-sand-600 text-base max-w-xs">
            {orders.length === 0
              ? "All caught up! No postcards to print right now."
              : "Try changing the filter or removing 'Today only'."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((order) => (
              <PrintCard
                key={order.id}
                order={order}
                onUpdateStatus={updateStatus}
                isLoading={actionLoadingId === order.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function PrintCard({
  order,
  onUpdateStatus,
  isLoading,
}: {
  order: PrintOrder;
  onUpdateStatus: (id: string, status: "printing" | "shipped" | "cancelled") => void;
  isLoading: boolean;
}) {
  const formatMeta = FORMAT_LABELS[order.format] ?? {
    name: order.format,
    dimensions: "",
    emoji: "•",
  };
  const isPrinting = order.status === "printing";
  const ageHours = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  const isUrgent = ageHours > 24 && !isPrinting;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
        isPrinting
          ? "border-amber-300"
          : isUrgent
          ? "border-rose-200"
          : "border-sand-200"
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between text-sm ${
          isPrinting ? "bg-amber-50" : isUrgent ? "bg-rose-50" : "bg-sand-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-gray-900">
            {order.orderReference ?? order.id.slice(0, 8)}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white text-xs font-medium border border-sand-200">
            {formatMeta.emoji} {formatMeta.name}
          </span>
          {isPrinting && (
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-medium">
              In progress
            </span>
          )}
        </div>
        <span className={`text-xs ${isUrgent ? "text-rose-600 font-medium" : "text-sand-600"}`}>
          {ageHours < 1
            ? `${Math.floor(ageHours * 60)}m ago`
            : ageHours < 24
            ? `${Math.floor(ageHours)}h ago`
            : `${Math.floor(ageHours / 24)}d ago`}
        </span>
      </div>

      {/* Photo */}
      {order.croppedImageUrl ? (
        <a
          href={order.croppedImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.croppedImageUrl}
            alt="Postcard"
            className={`w-full object-cover ${
              order.format === "large" ? "aspect-[2.12/1]" : "aspect-[1.4/1]"
            }`}
          />
        </a>
      ) : (
        <div className="aspect-[1.4/1] bg-sand-100 flex items-center justify-center text-sand-500 text-sm italic">
          No photo
        </div>
      )}

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Hotel + customer */}
        <div className="flex justify-between items-start text-sm">
          <div>
            <p className="text-xs text-sand-500 uppercase tracking-wide">From</p>
            <p className="font-medium text-gray-800">{order.hotelName}</p>
            {order.hotelCity && <p className="text-xs text-sand-600">{order.hotelCity}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-sand-500 uppercase tracking-wide">Customer</p>
            <p className="text-xs text-sand-700 truncate max-w-[180px]">
              {order.customerEmail}
            </p>
          </div>
        </div>

        {/* Address — print-friendly */}
        <div>
          <p className="text-xs text-sand-500 uppercase tracking-wide mb-1">Ship to</p>
          <div className="bg-sand-50 border border-sand-200 rounded-lg px-3 py-2 font-mono text-sm leading-relaxed">
            <div className="font-semibold text-gray-900">{order.recipientName}</div>
            <div className="text-gray-700">{order.recipientStreet}</div>
            <div className="text-gray-700">
              {order.recipientPostal} {order.recipientCity}
            </div>
            <div className="font-semibold text-gray-900 uppercase">
              {order.recipientCountry}
            </div>
          </div>
        </div>

        {/* Message */}
        {order.message && (
          <div>
            <p className="text-xs text-sand-500 uppercase tracking-wide mb-1">Message</p>
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 italic text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
              {order.message}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!isPrinting && (
            <button
              onClick={() => onUpdateStatus(order.id, "printing")}
              disabled={isLoading}
              className="flex-1 px-3 py-2.5 rounded-xl bg-amber-100 text-amber-900 text-sm font-medium hover:bg-amber-200 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Mark as printing
            </button>
          )}
          <button
            onClick={() => onUpdateStatus(order.id, "shipped")}
            disabled={isLoading}
            className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9-1.5h10.5a1.5 1.5 0 001.5-1.5V11.25a3.75 3.75 0 00-3.75-3.75H8.25a3.75 3.75 0 00-3.75 3.75v4.5a1.5 1.5 0 001.5 1.5z" />
              </svg>
            )}
            Mark as shipped
          </button>
          <button
            onClick={() => {
              if (confirm("Cancel this order?")) onUpdateStatus(order.id, "cancelled");
            }}
            disabled={isLoading}
            className="px-3 py-2.5 rounded-xl border border-sand-200 text-sand-600 text-sm font-medium hover:border-rose-300 hover:text-rose-600 active:scale-[0.97] transition-all disabled:opacity-50"
            title="Cancel order"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
