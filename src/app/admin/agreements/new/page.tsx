"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { hapticSuccess, hapticTap } from "@/lib/haptics";
import Spinner from "@/components/ui/Spinner";
import Select from "@/components/ui/Select";

interface Hotel {
  id: string;
  name: string;
  email: string;
  address: string | null;
  city: string | null;
}

const TEMPLATE_VARS = [
  { key: "hotel_name", label: "Hotel naam", required: true },
  { key: "hotel_address", label: "Adres", required: true, placeholder: "Markt 12" },
  { key: "hotel_city", label: "Postcode + stad", required: true, placeholder: "8000 Brugge" },
  { key: "hotel_email", label: "E-mail (contactpersoon)", required: true, type: "email" },
  { key: "hotel_btw", label: "BTW nummer", required: true, placeholder: "BE0123.456.789" },
  { key: "ingangsdatum", label: "Ingangsdatum", required: true, type: "date" },
  { key: "commission_pct", label: "Commissie %", required: true, type: "number", defaultValue: "15" },
];

export default function NewAgreementPage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState<string>("");
  const [vars, setVars] = useState<Record<string, string>>(() => ({
    commission_pct: "15",
    ingangsdatum: new Date().toISOString().slice(0, 10),
  }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/hotels");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setHotels(data || []);
      } catch {
        toast.error("Kon hotels niet laden");
      }
    })();
  }, []);

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.id === hotelId),
    [hotels, hotelId]
  );

  // Prefill from hotel record on selection
  useEffect(() => {
    if (!selectedHotel) return;
    setVars((prev) => ({
      ...prev,
      hotel_name: prev.hotel_name || selectedHotel.name,
      hotel_email: prev.hotel_email || selectedHotel.email,
      hotel_address: prev.hotel_address || selectedHotel.address || "",
      hotel_city: prev.hotel_city || selectedHotel.city || "",
    }));
  }, [selectedHotel]);

  const submit = async () => {
    if (!hotelId) {
      toast.error("Kies een hotel");
      return;
    }
    for (const v of TEMPLATE_VARS) {
      if (v.required && !vars[v.key]?.trim()) {
        toast.error(`Vul "${v.label}" in`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          templateKey: "hotel_partner_v1",
          variables: vars,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      const data = await res.json();
      hapticSuccess();
      toast.success("Concept aangemaakt");
      router.push(`/admin/agreements/${data.agreement.id}`);
    } catch (e) {
      toast.error((e as Error).message || "Aanmaken mislukt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-5">
        <Link
          href="/admin/agreements"
          className="text-base text-sand-600 hover:text-sand-800 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Overzicht
        </Link>
      </div>
      <h2 className="font-heading text-3xl font-medium text-gray-900 mb-1">
        Nieuwe overeenkomst
      </h2>
      <p className="text-base text-sand-600 mb-6">
        Hotel Partner Overeenkomst v1 — vul de variabelen in en sla op als concept.
      </p>

      <div className="bg-white rounded-2xl border-2 border-teal/20 p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-medium text-sand-600 mb-2 uppercase tracking-wide">
            Hotel
          </label>
          <Select
            value={hotelId}
            onChange={(v) => {
              hapticTap();
              setHotelId(v);
            }}
            placeholder="Kies een hotelpartner"
            options={hotels.map((h) => ({
              value: h.id,
              label: h.name,
              hint: h.email,
            }))}
          />
        </div>

        {hotelId && (
          <>
            <div className="border-t border-sand-100 pt-4">
              <p className="text-xs font-medium text-sand-600 uppercase tracking-wide mb-3">
                Variabelen
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATE_VARS.map((v) => (
                  <div key={v.key} className={v.key === "hotel_address" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-sand-500 mb-1">
                      {v.label}
                      {v.required && <span className="text-teal ml-1">*</span>}
                    </label>
                    <input
                      type={v.type || "text"}
                      placeholder={v.placeholder}
                      value={vars[v.key] || ""}
                      onChange={(e) =>
                        setVars((prev) => ({ ...prev, [v.key]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-base focus:outline-none focus:border-teal transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-sand-50 rounded-xl p-3 text-xs text-sand-700">
              <strong className="font-medium">Volgende stap:</strong> na opslaan kun je het
              concept bekijken, eventueel aanpassen en de signing-link versturen naar het
              hotel. Hotel tekent eerst, jij krijgt notificatie en tekent zelf vanuit admin.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link
                href="/admin/agreements"
                className="px-4 py-2.5 rounded-xl border-2 border-sand-200 text-sand-700 text-base font-medium hover:border-sand-300 transition-colors"
              >
                Annuleer
              </Link>
              <button
                onClick={submit}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-teal text-white text-base font-medium disabled:opacity-40 hover:bg-teal-600 transition-all flex items-center gap-2"
              >
                {submitting && <Spinner className="w-3.5 h-3.5" />}
                {submitting ? "Aanmaken..." : "Concept aanmaken"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
