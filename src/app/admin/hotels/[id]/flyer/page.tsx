"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { PRICE_DISPLAY } from "@/lib/constants";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
  welcomeMessage: string | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://postyourcard.com";
const TEMPLATES = ["premium", "bold", "tent-card", "scrapbook"] as const;
type Template = typeof TEMPLATES[number];

export default function FlyerPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.id as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template>("premium");

  const fetchHotel = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hotels");
      if (!res.ok) throw new Error("Failed");
      const hotels = await res.json();
      const found = hotels.find((h: Hotel) => h.id === hotelId);
      if (!found) throw new Error("Not found");
      setHotel(found);

      const url = `${BASE_URL}/order/${found.slug}?ref=flyer`;
      const qr = await QRCode.toDataURL(url, {
        width: 400,
        margin: 1,
        color: { dark: "#6B1F2A", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(qr);
    } catch {
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }, [hotelId, router]);

  useEffect(() => {
    fetchHotel();
  }, [fetchHotel]);

  // Compute scale so the A4 flyer fits the viewport (no scrolling)
  useEffect(() => {
    const FLYER_W_PX = (210 * 96) / 25.4; // 210mm in px @ 96dpi ≈ 793.7
    const FLYER_H_PX = (297 * 96) / 25.4; // ≈ 1122.5
    const updateScale = () => {
      const availableH = window.innerHeight - 100; // header + padding
      const availableW = window.innerWidth - 32;
      const scale = Math.min(availableH / FLYER_H_PX, availableW / FLYER_W_PX, 1);
      document.documentElement.style.setProperty("--flyer-scale", String(scale));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  if (loading || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const heroImage = hotel.heroImageUrl || "https://images.unsplash.com/photo-1742420999707-e2afe589a07c?w=1600&h=1000&fit=crop&crop=center&q=90";

  return (
    <>
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden; }
          .no-print { display: none !important; }
          .flyer { width: 210mm; height: 297mm; max-height: 297mm; margin: 0; padding: 0; box-shadow: none !important; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; }
          .flyer-wrapper { padding: 0 !important; margin: 0 !important; background: none !important; min-height: 0 !important; overflow: visible !important; }
          .flyer-scale-outer { width: 210mm !important; height: 297mm !important; aspect-ratio: auto !important; }
          .flyer-scale-inner { transform: none !important; position: static !important; }
        }
        @page { size: A4 portrait; margin: 0; }
      `}</style>

      {/* Controls */}
      <div className="no-print bg-white border-b border-sand-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 text-base text-sand-600 font-medium px-3 py-1.5 rounded-full bg-white border border-sand-200 shadow-sm hover:border-teal/30 hover:text-teal transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                template === t ? "bg-teal text-white shadow-sm" : "bg-sand-100 text-sand-600 hover:bg-sand-200"
              }`}
            >
              {t === "tent-card" ? "Tent Card" : t === "scrapbook" ? "Scrapbook" : t}
            </button>
          ))}
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal text-white text-base font-semibold hover:bg-teal-600 active:scale-[0.97] transition-all shadow-md shadow-teal/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Print / PDF
        </button>
      </div>

      <div className="flyer-wrapper flex justify-center items-start bg-gray-200 overflow-hidden" style={{ minHeight: "calc(100vh - 60px)", padding: "1rem" }}>
        <div
          className="flyer-scale-outer relative"
          style={{
            // A4 portrait: 210mm × 297mm = ratio 210/297
            // Fit inside available viewport (minus header + padding)
            width: "min(calc((100vh - 100px) * 210 / 297), calc(100vw - 32px))",
            aspectRatio: "210 / 297",
          }}
        >
          <div
            className="flyer-scale-inner absolute top-0 left-0 origin-top-left"
            style={{
              width: "210mm",
              height: "297mm",
              transform: "scale(var(--flyer-scale, 1))",
            }}
          >
            {template === "premium" && <PremiumFlyer hotel={hotel} heroImage={heroImage} qr={qrDataUrl} />}
            {template === "bold" && <BoldFlyer hotel={hotel} heroImage={heroImage} qr={qrDataUrl} />}
            {template === "tent-card" && <TentCardFlyer hotel={hotel} heroImage={heroImage} qr={qrDataUrl} />}
            {template === "scrapbook" && <ScrapbookFlyer hotel={hotel} heroImage={heroImage} qr={qrDataUrl} />}
          </div>
        </div>
      </div>
    </>
  );
}

const serif = "'Cormorant Garamond', 'Georgia', serif";
const sans = "'DM Sans', 'Helvetica Neue', sans-serif";

/* ═══════════════════════════════════════════
   PREMIUM — Elegant white with hero + QR island
   ═══════════════════════════════════════════ */
function PremiumFlyer({ heroImage, qr }: { hotel: Hotel; heroImage: string; qr: string | null }) {
  return (
    <div className="flyer w-[210mm] h-[297mm] shadow-2xl overflow-hidden flex flex-col relative">

      {/* ═══ TOP 45% — Full-bleed travel photo with cute postcard mockup ═══ */}
      <div className="relative" style={{ flex: "0 0 45%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-[#FAF6EE]" />

        {/* Cute floating postcard — bigger */}
        <div className="absolute top-1/2 left-1/2 z-20" style={{ transform: "translate(-50%, -50%) rotate(-4deg)" }}>
          <div className="w-[340px] bg-white rounded-xl shadow-2xl overflow-hidden border border-sand-200">
            {/* Photo top */}
            <div className="h-[170px] overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
              {/* Stamp */}
              <div className="absolute top-2.5 right-2.5 w-9 h-11 border border-[#6B1F2A]/40 rounded-[2px] bg-[#FAF6EE]/85 backdrop-blur-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6B1F2A]/40" />
              </div>
            </div>
            {/* Message + address */}
            <div className="px-4 py-3 bg-[#FFFEFA]">
              <p className="text-[13px] text-gray-700 italic leading-snug font-handwritten">
                Dear family, having the most amazing time in Bruges! Wish you were here...
              </p>
              <div className="border-t border-dashed border-sand-200 mt-2.5 pt-2 space-y-0.5">
                <p className="text-[11px] text-gray-800 font-semibold">Mrs. M. Janssens</p>
                <p className="text-[10px] text-gray-500">Bondgenotenlaan 12, 3000 Leuven</p>
              </div>
            </div>
          </div>
          {/* Soft shadow */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/15 rounded-[50%] blur-md" />
        </div>
      </div>

      {/* ═══ BOTTOM 55% — Cream background with QR top center ═══ */}
      <div className="relative bg-[#FAF6EE] flex flex-col" style={{ flex: "0 0 55%" }}>
        <div className="relative z-10 flex flex-col h-full px-10 pt-8 pb-4">

          {/* Tagline */}
          <h2 className="text-[26px] font-bold text-gray-900 leading-tight text-center mb-1" style={{ fontFamily: serif }}>
            Send a postcard with<br />your own picture!
          </h2>
          <p className="text-[17px] text-[#6B1F2A] font-bold text-center uppercase tracking-[0.15em]" style={{ fontFamily: sans }}>
            Worldwide!
          </p>

          {/* Spacer top */}
          <div className="flex-1" />

          {/* QR Code — vertically centered in bottom panel */}
          {qr && (
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-2xl p-3.5 shadow-xl border border-sand-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR Code" className="w-[180px] h-[180px]" />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 uppercase tracking-[0.2em] font-bold" style={{ fontFamily: sans }}>
                Scan to send
              </p>
            </div>
          )}

          {/* Spacer bottom */}
          <div className="flex-1" />

          {/* 4 steps — with icons + connector dots */}
          <div className="relative flex items-start justify-between mb-4 px-2">
            {/* Connector line behind circles */}
            <div className="absolute top-7 left-[8%] right-[8%] h-px border-t-2 border-dashed border-[#C9963A]/30" />

            {[
              { label: "Choose\nformat", icon: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" },
              { label: "Upload\nphoto", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6 20.25h12a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" },
              { label: "Write\nmessage", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
              { label: "We mail\nit!", icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center" style={{ width: "22%" }}>
                {/* Number badge corner */}
                <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-[#6B1F2A] text-white text-xs font-bold flex items-center justify-center shadow-md z-10">
                  {i + 1}
                </span>
                {/* Icon in gold circle */}
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-lg bg-white border-[3px]" style={{ borderColor: "#C9963A" }}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#C9963A" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                  </svg>
                </div>
                <p className="text-[14px] text-gray-800 leading-tight whitespace-pre-line font-semibold" style={{ fontFamily: sans }}>{step.label}</p>
              </div>
            ))}
          </div>

          {/* Spacer pushes footer to bottom */}
          <div className="flex-1" />

          {/* Price + footer */}
          <div className="border-t border-gray-300/50 pt-3 flex items-center justify-between">
            <p className="text-[11px] text-gray-400" style={{ fontFamily: sans }}>
              postyourcard.com · Made with ♥ in Bruges
            </p>
            <p className="text-[20px] font-bold text-[#6B1F2A] leading-none" style={{ fontFamily: serif }}>
              {PRICE_DISPLAY}<span className="text-[10px] text-gray-500 ml-1.5 font-medium" style={{ fontFamily: sans }}>incl. shipping</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOLD — Full-bleed hero, white text overlay
   ═══════════════════════════════════════════ */
function BoldFlyer({ hotel, heroImage, qr }: { hotel: Hotel; heroImage: string; qr: string | null }) {
  return (
    <div className="flyer w-[210mm] h-[297mm] shadow-2xl overflow-hidden relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/75" />

      <div className="relative z-10 h-full flex flex-col" style={{ padding: "15mm" }}>
        {/* Top */}
        <p className="text-white/70 text-[9px] uppercase tracking-[0.4em] font-bold" style={{ fontFamily: sans, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>PostYourCard</p>

        <div className="flex-1" />

        {/* Bottom content */}
        <div>
          <p className="uppercase tracking-[0.3em] text-white/80 text-xs font-bold mb-2" style={{ fontFamily: sans, textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
            Greetings from {hotel.city || "your trip"}
          </p>
          <h1 className="text-white text-[52px] font-bold leading-[1.02] mb-3" style={{ fontFamily: serif, textShadow: "0 4px 30px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)" }}>
            {hotel.name}
          </h1>
          <p className="text-white text-[20px] font-bold leading-tight mb-3" style={{ fontFamily: serif, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
            Send a postcard with your own picture!
          </p>
          <p className="text-white/90 text-[14px] uppercase tracking-[0.2em] font-bold mb-10" style={{ fontFamily: sans, textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
            Worldwide!
          </p>

          {/* QR + price row */}
          <div className="flex items-end justify-between">
            <div>
              <div className="bg-white rounded-2xl p-4 shadow-2xl inline-block mb-3">
                {qr && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr} alt="QR" className="w-[180px] h-[180px]" />
                  </>
                )}
              </div>
              <p className="text-white font-bold text-[12px] uppercase tracking-[0.2em]" style={{ fontFamily: sans, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
                Scan to send
              </p>
            </div>
            <div className="text-right">
              <p className="text-white text-[56px] font-bold leading-none" style={{ fontFamily: serif }}>
                {PRICE_DISPLAY}
              </p>
              <p className="text-white/70 text-xs mt-1" style={{ fontFamily: sans, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                Shipping included worldwide
              </p>
            </div>
          </div>
        </div>

        {/* Steps footer */}
        <div className="border-t border-white/20 mt-8 pt-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[
              { text: "Format" },
              { text: "Photo" },
              { text: "Message" },
              { text: "We mail" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-xs text-white/80 font-medium" style={{ fontFamily: sans }}>{s.text}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/50" style={{ fontFamily: sans }}>www.postyourcard.com</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TENT CARD — A5 fold, stands up on desk
   Top half = upside down (when folded, becomes back)
   Bottom half = front (visible when standing)
   ═══════════════════════════════════════════ */
function TentCardFlyer({ hotel, qr }: { hotel: Hotel; heroImage: string; qr: string | null }) {
  return (
    <div className="flyer w-[210mm] h-[297mm] shadow-2xl overflow-hidden flex flex-col bg-gradient-to-br from-[#FAF6EE] via-[#FAF6EE] to-[#EFE8D5]">

      {/* ── TOP HALF (printed upside down — becomes BACK when folded) ── */}
      <div className="h-1/2 relative overflow-hidden" style={{ transform: "rotate(180deg)" }}>
        {/* Rich burgundy gradient background */}
        <div className="absolute inset-0 bg-[#3D0F16] bg-[radial-gradient(circle_at_center,_#6B1F2A_0%,_#3D0F16_100%)]" />

        {/* Paper grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Faint hotel initial watermark */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[28rem] font-bold text-white/[0.02] select-none pointer-events-none leading-none"
          style={{ fontFamily: serif }}
        >
          {hotel.name[0]}
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-16 py-12">
          {/* Header */}
          <div className="mb-10">
            <p className="uppercase tracking-[0.5em] text-[10px] text-white/80 font-bold mb-3" style={{ fontFamily: sans }}>
              Simple &amp; Worldwide
            </p>
            <h3 className="text-white text-[30px] italic leading-tight" style={{ fontFamily: serif }}>
              How it works
            </h3>
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mt-5" />
          </div>

          {/* 3 steps — frosted glass icons */}
          <div className="grid grid-cols-4 gap-8 w-full max-w-[440px] mb-10">
            {[
              { icon: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12", num: "01", label: "Choose" },
              { icon: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z", num: "02", label: "Capture" },
              { icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10", num: "03", label: "Compose" },
              { icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5", num: "04", label: "Connect" },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-[1.2rem] bg-white/[0.08] backdrop-blur-md border border-white/15 flex items-center justify-center mb-4 shadow-xl">
                  <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
                <span className="text-[10px] font-black tracking-[0.2em] text-white/70 uppercase mb-1" style={{ fontFamily: sans }}>{s.num}</span>
                <p className="text-[14px] font-bold text-white tracking-tight" style={{ fontFamily: sans }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bottom tagline */}
          <p className="text-white/30 text-[9px] font-bold tracking-[0.4em] uppercase" style={{ fontFamily: sans }}>
            No Stamps Required &bull; Global Airmail
          </p>
        </div>

        {/* Fold line */}
        <div className="absolute bottom-0 left-8 right-8 h-px border-b border-dashed border-white/10" />
      </div>

      {/* ── BOTTOM HALF (FRONT — what guests see when tent stands up) ── */}
      <div className="h-1/2 flex flex-col items-center justify-between px-16 py-12 text-center relative overflow-hidden">
        {/* Faint hotel initial watermark */}
        <div
          className="absolute -top-10 -right-10 text-[20rem] font-bold text-[#6B1F2A]/[0.02] pointer-events-none select-none leading-none"
          style={{ fontFamily: serif }}
        >
          {hotel.name[0]}
        </div>

        {/* Spotlight gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.5)_0%,_transparent_70%)]" />

        {/* Header with decorative lines */}
        <div className="relative z-10">
          <h2 className="text-[36px] font-bold text-gray-900 leading-tight text-center mb-2" style={{ fontFamily: serif }}>
            Send a postcard with<br />your own picture!
          </h2>
          <p className="text-[18px] text-[#6B1F2A] font-bold uppercase tracking-[0.2em] text-center" style={{ fontFamily: sans }}>
            Worldwide!
          </p>
        </div>

        {/* QR Island with floating shadow */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="p-6 bg-white rounded-[3rem] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.07)] border border-gray-100/80 mb-5">
            {qr && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR" className="w-[220px] h-[220px]" />
              </>
            )}
          </div>
          <p className="text-gray-500 text-base italic" style={{ fontFamily: serif }}>
            Scan to send a real postcard
          </p>
          <div className="h-1 w-12 bg-[#6B1F2A]/15 rounded-full mt-3" />
        </div>

        {/* Elegant footer */}
        <div className="relative z-10 w-full pt-6 border-t border-gray-200/50 flex justify-between items-end">
          <div>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]" style={{ fontFamily: sans }}>Worldwide</p>
            <p className="text-base font-bold text-gray-800 uppercase" style={{ fontFamily: sans }}>Airmail Included</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-[#6B1F2A]/60 uppercase tracking-[0.15em] mb-0.5" style={{ fontFamily: sans }}>Fixed Price</p>
            <p className="text-[28px] font-bold text-gray-900 leading-none" style={{ fontFamily: serif }}>{PRICE_DISPLAY}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]" style={{ fontFamily: sans }}>Service by</p>
            <p className="text-base font-bold text-gray-800" style={{ fontFamily: sans }}>PostYourCard</p>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   SCRAPBOOK — uses /public/flyer-scrapbook-base.png as full poster
   with our dynamic QR code overlaid on the QR area
   ═══════════════════════════════════════════ */
function ScrapbookFlyer({ qr }: { hotel: Hotel; heroImage: string; qr: string | null }) {
  return (
    <div className="flyer w-[210mm] h-[297mm] shadow-2xl overflow-hidden relative bg-white">
      {/* Full poster image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/flyer-scrapbook-base.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dynamic QR — placed in the blank bottom-right area of the cream panel */}
      {qr && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            right: "10%",
            bottom: "10%",
          }}
        >
          <div
            className="bg-white"
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "18px",
              padding: "14px",
              boxShadow: "0 16px 35px rgba(0,0,0,0.12)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR Code" className="w-full h-full object-contain" />
          </div>
          <p
            style={{
              marginTop: "12px",
              fontSize: "12px",
              letterSpacing: "5px",
              fontWeight: 800,
              color: "#6b7280",
              fontFamily: sans,
            }}
          >
            SCAN HERE
          </p>
        </div>
      )}
    </div>
  );
}

