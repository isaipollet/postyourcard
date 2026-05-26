"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import SignaturePad from "@/components/SignaturePad";
import Spinner from "@/components/ui/Spinner";
import ContractArticles from "@/components/agreements/ContractArticles";

interface Agreement {
  id: string;
  contractNr: string;
  status: string;
  templateKey: string;
  variables: Record<string, string>;
  signedPdfUrl: string | null;
}

interface Hotel {
  id: string;
  name: string;
  email: string;
}

export default function PublicSignPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);

  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerFunction, setSignerFunction] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sign/${token}`);
      if (!res.ok) {
        setError("Deze link is ongeldig of verlopen.");
        return;
      }
      const data = await res.json();
      setAgreement(data.agreement);
      setHotel(data.hotel);
      // Prefill email from variables
      if (data.agreement?.variables?.hotel_email && !signerEmail) {
        setSignerEmail(data.agreement.variables.hotel_email);
      }
    } catch {
      setError("Kon overeenkomst niet laden.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!signerName.trim() || signerName.trim().length < 2) {
      toast.error("Vul uw volledige naam in");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) {
      toast.error("Vul een geldig e-mailadres in");
      return;
    }
    if (!signature) {
      toast.error("Plaats een handtekening");
      return;
    }
    if (!accepted) {
      toast.error("Bevestig akkoord met de voorwaarden");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signerEmail: signerEmail.trim(),
          signerFunction: signerFunction.trim() || undefined,
          signatureDataUrl: signature,
          acceptedTerms: true,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Submit failed");
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error((e as Error).message || "Ondertekenen mislukt");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
        <Spinner className="w-6 h-6 text-[#6B1F2A]" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-3">📭</div>
          <h1 className="font-heading text-3xl font-medium text-[#6B1F2A] mb-2">
            Link niet beschikbaar
          </h1>
          <p className="text-sand-700">{error}</p>
        </div>
      </div>
    );
  }
  if (!agreement || !hotel) return null;

  // Already signed by hotel — show confirmation
  if (
    !done &&
    (agreement.status === "signed_by_hotel" ||
      agreement.status === "completed")
  ) {
    return (
      <ConfirmationView
        contractNr={agreement.contractNr}
        completed={agreement.status === "completed"}
        pdfUrl={agreement.signedPdfUrl}
      />
    );
  }
  if (done) {
    return (
      <ConfirmationView contractNr={agreement.contractNr} completed={false} />
    );
  }

  const v = agreement.variables;
  const commission = ((799 * Number(v.commission_pct || 15)) / 100 / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <header className="bg-[#6B1F2A] text-white relative overflow-hidden">
        {/* Subtle decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-[#C9963A]/10 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto py-10 px-6 relative">
          <p className="text-[11px] uppercase tracking-[0.3em] opacity-80 font-medium">
            PostYourCard
          </p>
          <h1 className="font-heading text-4xl font-medium mt-2 leading-tight">
            Samenwerkingsovereenkomst
          </h1>
          <p className="text-base opacity-90 mt-2">
            voor <span className="font-medium">{hotel.name}</span>
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-gradient-to-r from-[#6B1F2A]/[0.04] to-transparent border-b border-sand-100">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#6B1F2A] font-semibold">
              Overzicht
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 p-6">
            <Detail label="Contract" value={agreement.contractNr} mono />
            <Detail
              label="Ingangsdatum"
              value={
                v.ingangsdatum
                  ? new Date(v.ingangsdatum).toLocaleDateString("nl-BE")
                  : "—"
              }
            />
            <Detail label="Hotel" value={v.hotel_name || hotel.name} />
            <Detail label="BTW" value={v.hotel_btw || "—"} />
            <Detail label="Commissie" value={`${v.commission_pct || 15}%`} highlight />
            <Detail label="Per kaart" value={`€${commission}`} highlight />
          </div>
        </div>

        {/* Contract preview — article cards */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-sand-600 font-semibold pl-1">
            Voorwaarden
          </p>
          <ContractArticles
            hotelName={v.hotel_name || hotel.name}
            commissionPct={Number(v.commission_pct || 15)}
            commission={commission}
          />
        </div>

        {/* Sign form */}
        <div className="bg-white rounded-2xl border-2 border-[#6B1F2A]/20 p-5 space-y-4">
          <h2 className="font-heading text-lg font-medium text-gray-900">
            Onderteken namens {hotel.name}
          </h2>
          <p className="text-base text-sand-700">
            Vul uw gegevens in en plaats hieronder uw handtekening. Door te ondertekenen
            verklaart u akkoord met de bovenstaande voorwaarden. PostYourCard ontvangt een
            notificatie en ondertekent vervolgens namens haar zijde — daarna ontvangt u
            automatisch het volledig getekende contract per e-mail.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Volledige naam"
              value={signerName}
              onChange={setSignerName}
              required
            />
            <Field
              label="Functie"
              value={signerFunction}
              onChange={setSignerFunction}
              placeholder="bv. Zaakvoerder"
            />
            <div className="md:col-span-2">
              <Field
                label="E-mailadres"
                value={signerEmail}
                onChange={setSignerEmail}
                type="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sand-500 mb-1 uppercase tracking-wide">
              Handtekening
            </label>
            <SignaturePad onChange={setSignature} />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#6B1F2A]"
            />
            <span className="text-base text-sand-700">
              Ik ga akkoord met de bovenstaande overeenkomst en bevestig dat ik bevoegd ben
              om namens <strong>{hotel.name}</strong> te ondertekenen. Ik begrijp dat deze
              elektronische handtekening juridisch bindend is onder eIDAS (Verordening
              910/2014).
            </span>
          </label>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full px-5 py-3 rounded-xl bg-[#6B1F2A] text-white text-base font-medium hover:bg-[#5A1822] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {submitting && <Spinner className="w-3.5 h-3.5" />}
            {submitting ? "Bezig met ondertekenen..." : "Onderteken contract"}
          </button>
        </div>

        <p className="text-xs text-center text-sand-500 py-4">
          PostYourCard · postyourcard.com · Belgisch recht · Audit trail wordt automatisch
          opgeslagen
        </p>
      </div>
    </div>
  );
}

function ConfirmationView({
  contractNr,
  completed,
  pdfUrl,
}: {
  contractNr: string;
  completed: boolean;
  pdfUrl?: string | null;
}) {
  return (
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6">
      <div className="max-w-md text-center bg-white rounded-2xl border border-sand-200 p-8">
        <div className="text-5xl mb-4">{completed ? "📜" : "✅"}</div>
        <h1 className="font-heading text-3xl font-medium text-[#6B1F2A] mb-2">
          {completed ? "Volledig getekend" : "Bedankt — getekend"}
        </h1>
        <p className="text-sand-700 mb-4">
          {completed
            ? "Beide partijen hebben de overeenkomst ondertekend. U kunt het contract hieronder downloaden."
            : "Uw handtekening is opgeslagen. PostYourCard wordt nu op de hoogte gebracht en zal binnenkort namens haar zijde ondertekenen. U ontvangt een e-mail zodra het contract volledig getekend is."}
        </p>
        <p className="text-xs text-sand-500 font-mono mb-4">{contractNr}</p>
        {completed && pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#6B1F2A] text-white text-base font-medium hover:bg-[#5A1822]"
          >
            Download getekend contract
          </a>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-sand-500 mb-1 uppercase tracking-wide">
        {label}
        {required && <span className="text-[#6B1F2A] ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-sand-200 text-base focus:outline-none focus:border-[#6B1F2A] transition-colors bg-white"
      />
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-sand-600 uppercase tracking-[0.15em] font-semibold mb-1">
        {label}
      </p>
      <p
        className={`${
          mono ? "font-mono text-xs text-gray-800" : "text-base"
        } ${
          highlight
            ? "text-[#6B1F2A] font-semibold text-lg"
            : "text-gray-800 font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

