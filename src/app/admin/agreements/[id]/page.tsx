"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import SignaturePad from "@/components/SignaturePad";
import ContractArticles from "@/components/agreements/ContractArticles";
import { hapticSuccess, hapticTap } from "@/lib/haptics";

interface Agreement {
  id: string;
  contractNr: string;
  status: string;
  templateKey: string;
  variables: Record<string, string>;
  signToken: string;
  signedPdfUrl: string | null;
  sentAt: string | null;
  signedByHotelAt: string | null;
  signedByPostyourcardAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface Hotel {
  id: string;
  name: string;
  email: string;
}

interface Signature {
  id: string;
  party: string;
  signerName: string;
  signerEmail: string;
  signerFunction: string | null;
  signatureDataUrl: string;
  signedAt: string;
  ip: string | null;
  userAgent: string | null;
}

interface Event {
  id: string;
  type: string;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  draft: { label: "Concept", tone: "bg-sand-100 text-sand-700" },
  sent: { label: "Verzonden", tone: "bg-blue-50 text-blue-700" },
  opened: { label: "Geopend", tone: "bg-amber-50 text-amber-700" },
  signed_by_hotel: { label: "Hotel getekend — wacht op jou", tone: "bg-orange-100 text-orange-800" },
  completed: { label: "Voltooid", tone: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Geannuleerd", tone: "bg-slate-100 text-slate-600" },
};

const EVENT_LABEL: Record<string, string> = {
  created: "Aangemaakt",
  sent: "Verzonden naar hotel",
  opened: "Door hotel geopend",
  signed_hotel: "Hotel getekend",
  signed_postyourcard: "PostYourCard getekend",
  completed: "Voltooid (PDF gegenereerd)",
};

export default function AgreementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<{
    agreement: Agreement;
    hotel: Hotel;
    signatures: Signature[];
    events: Event[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Sign-as-PostYourCard form
  const [showSignForm, setShowSignForm] = useState(false);
  const [signerName, setSignerName] = useState("Remy Pollet");
  const [signerEmail, setSignerEmail] = useState("info@postyourcard.com");
  const [signerFunction, setSignerFunction] = useState("Zaakvoerder");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/agreements/${id}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Kon overeenkomst niet laden");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 flex items-center justify-center">
        <Spinner className="w-6 h-6 text-teal" />
      </div>
    );
  }

  const { agreement, hotel, signatures, events } = data;
  const status = STATUS_LABEL[agreement.status] || {
    label: agreement.status,
    tone: "bg-sand-100 text-sand-700",
  };

  const send = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/agreements/${id}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      hapticSuccess();
      toast.success("Signing-link verzonden naar hotel");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/sign/${agreement.signToken}`;
    await navigator.clipboard.writeText(url);
    hapticSuccess();
    toast.success("Signing-link gekopieerd");
  };

  const submitPostYourCardSignature = async () => {
    if (!signatureDataUrl) {
      toast.error("Plaats eerst een handtekening");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/agreements/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName,
          signerEmail,
          signerFunction,
          signatureDataUrl,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      hapticSuccess();
      toast.success("Getekend — contract voltooid en mailings verzonden");
      setShowSignForm(false);
      setSignatureDataUrl(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const signUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sign/${agreement.signToken}`
    : "";

  const hotelSig = signatures.find((s) => s.party === "hotel");
  const pycSig = signatures.find((s) => s.party === "postyourcard");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
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

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-heading text-3xl font-medium text-gray-900">
            {hotel?.name || "—"}
          </h2>
          <p className="text-base text-sand-500 font-mono mt-1">
            {agreement.contractNr}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${status.tone}`}
        >
          {status.label}
        </span>
      </div>

      {/* Action panel */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5 mb-5">
        {agreement.status === "draft" && (
          <ActionRow
            title="Verstuur naar hotel"
            description={`Stuur signing-link naar ${agreement.variables.hotel_email || hotel?.email}.`}
            cta="Verstuur signing-link"
            onClick={send}
            busy={busy}
          />
        )}
        {(agreement.status === "sent" || agreement.status === "opened") && (
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-800">
                Wacht op handtekening hotel
              </p>
              <p className="text-base text-sand-600 mt-1">
                {agreement.status === "opened"
                  ? "Hotel heeft de link al geopend."
                  : "Link is verzonden, nog niet geopend."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-sand-50 text-sand-700 text-xs font-medium hover:bg-sand-100"
              >
                Kopieer signing-link
              </button>
              <button
                onClick={send}
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-teal/[0.07] text-teal text-xs font-medium hover:bg-teal/15 disabled:opacity-40"
              >
                Stuur opnieuw
              </button>
            </div>
            <p className="text-xs text-sand-500 break-all bg-sand-50 p-2 rounded font-mono">
              {signUrl}
            </p>
          </div>
        )}
        {agreement.status === "signed_by_hotel" && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="font-medium text-orange-900">
                Hotel heeft getekend — jouw beurt
              </p>
              <p className="text-base text-orange-800 mt-1">
                Onderteken namens PostYourCard om de overeenkomst te voltooien. Daarna
                wordt de getekende PDF automatisch naar beide partijen gestuurd.
              </p>
            </div>
            {!showSignForm ? (
              <button
                onClick={() => {
                  hapticTap();
                  setShowSignForm(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-teal text-white text-base font-medium hover:bg-teal-600 transition-all"
              >
                Onderteken namens PostYourCard
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-sand-50 rounded-xl border border-sand-200">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Naam"
                    value={signerName}
                    onChange={setSignerName}
                  />
                  <Field
                    label="Functie"
                    value={signerFunction}
                    onChange={setSignerFunction}
                  />
                </div>
                <Field
                  label="E-mail"
                  value={signerEmail}
                  onChange={setSignerEmail}
                  type="email"
                />
                <div>
                  <label className="block text-xs font-medium text-sand-600 mb-1 uppercase tracking-wide">
                    Handtekening
                  </label>
                  <SignaturePad onChange={setSignatureDataUrl} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowSignForm(false)}
                    className="px-4 py-2 rounded-xl border border-sand-200 text-sand-600 text-base font-medium"
                  >
                    Annuleer
                  </button>
                  <button
                    onClick={submitPostYourCardSignature}
                    disabled={busy || !signatureDataUrl}
                    className="px-5 py-2 rounded-xl bg-teal text-white text-base font-medium disabled:opacity-40 flex items-center gap-2"
                  >
                    {busy && <Spinner className="w-3.5 h-3.5" />}
                    {busy ? "Bezig..." : "Onderteken & voltooi"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {agreement.status === "completed" && agreement.signedPdfUrl && (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="font-medium text-emerald-900">
                Overeenkomst voltooid
              </p>
              <p className="text-base text-emerald-800 mt-1">
                Beide partijen hebben getekend op{" "}
                {agreement.completedAt
                  ? new Date(agreement.completedAt).toLocaleString("nl-BE")
                  : "—"}
                .
              </p>
            </div>
            <a
              href={agreement.signedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal text-white text-base font-medium hover:bg-teal-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Download getekend contract
            </a>
          </div>
        )}
      </div>

      {/* Contract variables — overview card */}
      <div className="bg-white rounded-2xl border border-sand-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-6 py-3 bg-gradient-to-r from-teal/[0.04] to-transparent border-b border-sand-100">
          <p className="text-[11px] uppercase tracking-[0.2em] text-teal font-semibold">
            Overzicht
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 p-6">
          <VariableField label="Hotel" value={agreement.variables.hotel_name} />
          <VariableField label="BTW" value={agreement.variables.hotel_btw} />
          <VariableField
            label="Ingangsdatum"
            value={
              agreement.variables.ingangsdatum
                ? new Date(agreement.variables.ingangsdatum).toLocaleDateString("nl-BE")
                : "—"
            }
          />
          <VariableField label="Adres" value={agreement.variables.hotel_address} />
          <VariableField label="Postcode + stad" value={agreement.variables.hotel_city} />
          <VariableField label="E-mail" value={agreement.variables.hotel_email} />
          <VariableField
            label="Commissie"
            value={`${agreement.variables.commission_pct || 15}%`}
            highlight
          />
          <VariableField
            label="Per kaart"
            value={`€${(((agreement.variables.commission_pct ? Number(agreement.variables.commission_pct) : 15) * 7.99) / 100).toFixed(2)}`}
            highlight
          />
        </div>
      </div>

      {/* Contract preview — collapsable */}
      <details className="bg-transparent mb-5 group">
        <summary className="cursor-pointer flex items-center gap-2 px-2 mb-3 text-[11px] uppercase tracking-[0.3em] text-sand-600 font-semibold hover:text-teal transition-colors">
          <svg
            className="w-3.5 h-3.5 transition-transform group-open:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          Bekijk volledig contract (9 artikels)
        </summary>
        <ContractArticles
          hotelName={agreement.variables.hotel_name || hotel?.name || ""}
          commissionPct={Number(agreement.variables.commission_pct || 15)}
          commission={(((Number(agreement.variables.commission_pct || 15)) * 7.99) / 100).toFixed(2)}
        />
      </details>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <SignatureCard role="Hotel" sig={hotelSig} />
        <SignatureCard role="PostYourCard" sig={pycSig} />
      </div>

      {/* Audit log */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5">
        <h3 className="font-heading font-medium text-gray-800 mb-3">Audit trail</h3>
        <div className="space-y-2">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-3 py-2 border-b border-sand-100 last:border-0 text-sm"
            >
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-teal mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">
                  {EVENT_LABEL[evt.type] || evt.type}
                </p>
                <p className="text-xs text-sand-500 mt-0.5">
                  {new Date(evt.createdAt).toLocaleString("nl-BE")}
                  {evt.ip && ` · IP ${evt.ip}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-sand-600 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-sand-200 text-base focus:outline-none focus:border-teal transition-colors bg-white"
      />
    </div>
  );
}

function ActionRow({
  title,
  description,
  cta,
  onClick,
  busy,
}: {
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-base text-sand-600 mt-1">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={busy}
        className="px-5 py-2.5 rounded-xl bg-teal text-white text-base font-medium hover:bg-teal-600 disabled:opacity-40 transition-all flex-shrink-0 flex items-center gap-2"
      >
        {busy && <Spinner className="w-3.5 h-3.5" />}
        {cta}
      </button>
    </div>
  );
}

function SignatureCard({
  role,
  sig,
}: {
  role: string;
  sig?: Signature;
}) {
  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-4">
      <p className="text-xs font-medium text-sand-500 uppercase tracking-wide mb-2">
        {role}
      </p>
      {sig ? (
        <div className="space-y-2">
          <div className="bg-sand-50 rounded-lg p-2 border border-sand-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sig.signatureDataUrl}
              alt="signature"
              className="h-12 mx-auto object-contain"
            />
          </div>
          <p className="text-base font-medium text-gray-800">{sig.signerName}</p>
          {sig.signerFunction && (
            <p className="text-xs text-sand-600">{sig.signerFunction}</p>
          )}
          <p className="text-xs text-sand-500">{sig.signerEmail}</p>
          <p className="text-xs text-sand-600">
            {new Date(sig.signedAt).toLocaleString("nl-BE")}
          </p>
        </div>
      ) : (
        <p className="text-base italic text-sand-400 py-4 text-center">
          Nog niet getekend
        </p>
      )}
    </div>
  );
}

function VariableField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-sand-600 uppercase tracking-[0.15em] font-semibold mb-1">
        {label}
      </p>
      <p
        className={
          highlight
            ? "text-teal font-semibold text-lg"
            : "text-gray-800 text-base font-medium"
        }
      >
        {value || "—"}
      </p>
    </div>
  );
}
