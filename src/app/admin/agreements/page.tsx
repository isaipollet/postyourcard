"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { hapticTap } from "@/lib/haptics";

interface AgreementRow {
  id: string;
  contractNr: string;
  status: string;
  templateKey: string;
  hotelId: string;
  hotelName: string | null;
  hotelEmail: string | null;
  sentAt: string | null;
  signedByHotelAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  draft: { label: "Concept", tone: "bg-sand-100 text-sand-700" },
  sent: { label: "Verzonden", tone: "bg-blue-50 text-blue-700" },
  opened: { label: "Geopend", tone: "bg-amber-50 text-amber-700" },
  signed_by_hotel: { label: "Hotel getekend", tone: "bg-orange-100 text-orange-800" },
  completed: { label: "Voltooid", tone: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Geannuleerd", tone: "bg-slate-100 text-slate-600" },
};

export default function AgreementsListPage() {
  const [rows, setRows] = useState<AgreementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/agreements");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setRows(data.agreements || []);
      } catch {
        toast.error("Kon overeenkomsten niet laden");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-3xl font-medium text-gray-900">
            Agreements
          </h2>
          <p className="text-base text-sand-600">
            {rows.length} overeenkomst{rows.length === 1 ? "" : "en"}
          </p>
        </div>
        <Link
          href="/admin/agreements/new"
          onClick={() => hapticTap()}
          className="px-4 py-2.5 rounded-xl bg-teal text-white text-base font-medium hover:bg-teal-600 active:scale-[0.97] transition-all flex items-center gap-1.5 shadow-sm shadow-teal/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe overeenkomst
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-sand-200 p-5 animate-pulse h-24"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-teal/[0.07] flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-teal/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-gray-800 text-lg mb-1">
            Nog geen overeenkomsten
          </h3>
          <p className="text-sand-600 text-base mb-5 max-w-sm">
            Maak een eerste samenwerkingsovereenkomst aan voor een hotelpartner. Verzend de
            link, laat ondertekenen, jij ondertekent vanuit admin — klaar.
          </p>
          <Link
            href="/admin/agreements/new"
            className="px-5 py-2.5 rounded-xl bg-teal text-white text-base font-medium hover:bg-teal-600 active:scale-[0.97] transition-all"
          >
            Eerste overeenkomst aanmaken
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const status = STATUS_LABEL[r.status] || {
              label: r.status,
              tone: "bg-sand-100 text-sand-700",
            };
            return (
              <Link
                key={r.id}
                href={`/admin/agreements/${r.id}`}
                className="block bg-white rounded-2xl border border-sand-200 hover:border-sand-300 hover:shadow-sm p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-medium text-gray-900 truncate">
                        {r.hotelName || "—"}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-sand-500 font-mono">{r.contractNr}</p>
                  </div>
                  <div className="text-right text-xs text-sand-500 flex-shrink-0">
                    <p>Aangemaakt</p>
                    <p className="text-sand-700 mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString("nl-BE")}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
