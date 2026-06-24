"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import { useOrderStore, PostcardFormat } from "@/store/order";
import { FORMATS } from "@/lib/constants";
import { hapticTap } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Hotel {
  name: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  city: string | null;
  website: string | null;
  welcomeMessage: string | null;
}

const DEFAULT_HERO = "https://images.unsplash.com/photo-1742420999707-e2afe589a07c?w=1600&h=1000&fit=crop&crop=center&q=85";

// 4 individual format cards — 2 per family row, each with its own Bruges photo
const FORMAT_OPTIONS = [
  {
    family: "standard" as const,
    familyTitleKey: "format.standard.name" as const,
    photoHeight: 118,
    items: [
      {
        key: "standard" as PostcardFormat,
        labelKey: "format.orientation.horizontal" as const,
        dims: "148 × 105 mm",
        imageUrl: "https://res.cloudinary.com/dz8wrj1xz/image/upload/v1782331964/postyourcard-demo/standard-h.jpg",
        shapeW: 22,
        shapeH: 16,
      },
      {
        key: "standard-v" as PostcardFormat,
        labelKey: "format.orientation.vertical" as const,
        dims: "105 × 148 mm",
        imageUrl: "https://res.cloudinary.com/dz8wrj1xz/image/upload/v1782331967/postyourcard-demo/standard-v.jpg",
        shapeW: 16,
        shapeH: 22,
      },
    ],
  },
  {
    family: "large" as const,
    familyTitleKey: "format.large.name" as const,
    photoHeight: 88,
    items: [
      {
        key: "large" as PostcardFormat,
        labelKey: "format.orientation.horizontal" as const,
        dims: "210 × 99 mm",
        imageUrl: "https://res.cloudinary.com/dz8wrj1xz/image/upload/v1782331972/postyourcard-demo/large-h.jpg",
        shapeW: 28,
        shapeH: 13,
      },
      {
        key: "large-v" as PostcardFormat,
        labelKey: "format.orientation.vertical" as const,
        dims: "99 × 210 mm",
        imageUrl: "https://res.cloudinary.com/dz8wrj1xz/image/upload/v1782331976/postyourcard-demo/large-v.jpg",
        shapeW: 13,
        shapeH: 28,
      },
    ],
  },
] as const;

export default function HotelLandingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.hotelSlug as string;

  const { selectedFormat, setFormat, reset, setHotelLogoUrl } = useOrderStore();
  const { t } = useLanguage();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reset();
    fetch(`/api/hotels/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Hotel not found");
        return res.json();
      })
      .then((data) => { setHotel(data); setHotelLogoUrl(data.logoUrl ?? null); })
      .catch(() => { setHotel({ name: slug.replace(/-/g, " "), logoUrl: null, heroImageUrl: null, city: null, website: null, welcomeMessage: null }); setHotelLogoUrl(null); })
      .finally(() => setLoading(false));
  }, [slug, reset]);

  const handleStart = () => {
    if (!selectedFormat) return;
    hapticTap();
    router.push(`/order/${slug}/upload`);
  };

  return (
    <div className="page-fade-in">
      <ProgressBar currentStep={1} />

      {/* ═══════ HERO — full bleed travel photo ═══════ */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: "520px" }}>
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hotel?.heroImageUrl || DEFAULT_HERO}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlays — strong enough for white text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-transparent" style={{ top: "55%" }} />

        {/* Floating decorations */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [12, 16, 12] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 right-[10%] w-6 h-8 border border-white/20 rounded-sm bg-white/10"
        />
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[8%] w-10 h-10 rounded-full border border-dashed border-white/15"
        />

        {/* Content — vertically centered title group */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12" style={{ minHeight: "520px" }}>
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <span className="block w-7 h-px bg-[#E8C47A]" />
            <span
              className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#E8C47A]"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
            >
              {t("hero.eyebrow")}
            </span>
            <span className="block w-7 h-px bg-[#E8C47A]" />
          </motion.div>

          {/* Hotel name */}
          {loading ? (
            <div className="h-12 w-56 bg-white/20 animate-pulse rounded-lg mx-auto mb-2" />
          ) : (
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-heading text-[2.25rem] sm:text-[2.75rem] font-light text-white capitalize text-center px-2 break-words"
              style={{
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                letterSpacing: "-0.01em",
                lineHeight: "1.05",
              }}
            >
              {hotel?.name}
            </motion.h1>
          )}

          {hotel?.logoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="mt-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hotel.logoUrl}
                alt={hotel.name}
                className="h-14 max-w-[200px] object-contain"
                style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
              />
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="font-heading italic mt-3 text-[1.25rem] max-w-[340px] mx-auto leading-snug text-center"
            style={{
              color: "#FAF6EE",
              fontWeight: 500,
              textShadow: "0 2px 14px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.7)",
            }}
          >
            {hotel?.welcomeMessage
              || (hotel?.city
                ? t("hero.greetingsFrom", { city: hotel.city })
                : t("hero.fallbackSubtitle"))
            }
          </motion.p>
        </div>
      </div>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm mx-auto px-4 -mt-8 mb-6 relative z-20"
      >
        <div className="bg-gradient-to-br from-white to-[#6B1F2A]/[0.04] rounded-2xl shadow-lg p-5 border border-[#6B1F2A]/[0.08]">
          <div className="flex items-center justify-between">
            {[
              { label: t("steps.format"), delay: 0.5, iconEl: (
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
              )},
              { label: t("steps.photo"), delay: 0.55, iconEl: (
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              )},
              { label: t("steps.message"), delay: 0.6, iconEl: (
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              )},
              { label: t("steps.mail"), delay: 0.65, iconEl: (
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )},
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: step.delay, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-1.5">
                  <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center">
                    {step.iconEl}
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {i + 1}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-gray-800">{step.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══════ FORMAT SELECTION ═══════ */}
      <div className="w-full px-4 pb-10 relative overflow-hidden">
        {/* Warm ambient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#6B1F2A]/[0.03] via-[#C9963A]/[0.04] to-[#6B1F2A]/[0.02] pointer-events-none" />
        <div className="absolute top-10 -left-20 w-[300px] h-[300px] rounded-full bg-[#6B1F2A]/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-20 w-[250px] h-[250px] rounded-full bg-[#C9963A]/[0.05] blur-3xl pointer-events-none" />
        <div className="max-w-sm mx-auto relative z-10">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-heading text-2xl font-medium text-gray-900 mb-4 text-center"
          >
            {t("format.title")}
          </motion.h2>

          <div className="space-y-6">
            {FORMAT_OPTIONS.map((group, gi) => (
              <motion.div
                key={group.family}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + 0.12 * gi, duration: 0.5 }}
              >
                {/* Family label */}
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6B1F2A]/40 mb-2.5 ml-0.5">
                  {t(group.familyTitleKey)}
                </p>

                {/* 2-card side-by-side row */}
                <div className="grid grid-cols-2 gap-2.5">
                  {group.items.map((item) => {
                    const isSelected = selectedFormat === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => { hapticTap(); setFormat(item.key); }}
                        className={`relative rounded-2xl overflow-hidden text-left transition-all duration-200 ${
                          isSelected
                            ? "ring-2 ring-teal shadow-xl shadow-teal/20"
                            : "ring-1 ring-black/[0.07] shadow-md hover:shadow-lg hover:ring-teal/30"
                        }`}
                      >
                        {/* Photo area */}
                        <div className="relative w-full overflow-hidden" style={{ height: group.photoHeight }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt=""
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                              isSelected ? "scale-105 saturate-100" : "scale-100 saturate-[0.72]"
                            }`}
                          />
                          {/* Bottom fade for legibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                        </div>

                        {/* Info strip */}
                        <div className={`px-3 py-2.5 transition-colors duration-200 ${
                          isSelected ? "bg-teal" : "bg-white"
                        }`}>
                          <div className="flex items-center gap-2">
                            {/* Postcard shape indicator */}
                            <div
                              className={`rounded-[2px] border-[1.5px] flex-shrink-0 ${
                                isSelected ? "border-white/65" : "border-gray-300"
                              }`}
                              style={{ width: item.shapeW, height: item.shapeH }}
                            />
                            {/* Label + dims */}
                            <div className="flex flex-col gap-[3px] min-w-0">
                              <span className={`text-[11px] font-bold leading-none truncate ${
                                isSelected ? "text-white" : "text-gray-800"
                              }`}>
                                {t(item.labelKey)}
                              </span>
                              <span className={`text-[9px] leading-none truncate ${
                                isSelected ? "text-white/70" : "text-gray-400"
                              }`}>
                                {item.dims}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Selected checkmark badge */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 320 }}
                            className="absolute top-2 right-2 w-6 h-6 bg-teal rounded-full flex items-center justify-center shadow-lg"
                          >
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Price row for this family */}
                <div className="flex items-baseline gap-1.5 mt-2 ml-0.5">
                  <span className="font-heading text-[17px] font-medium text-[#6B1F2A] tabular-nums">
                    {FORMATS[group.items[0].key].price}
                  </span>
                  <span className="text-[10px] text-gray-400">{t("format.shippingIncluded")}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-5 py-3"
          >
            {[t("trust.shippingIncluded"), t("trust.worldwide"), t("trust.printedIn24h"), t("trust.paper350g")].map((text) => (
              <div key={text} className="flex items-center gap-1 text-[10px] text-sand-500 font-medium">
                <svg className="w-3 h-3 text-teal/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {text}
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <button
            onClick={handleStart}
            disabled={!selectedFormat}
            className={`w-full mt-3 py-4 px-6 rounded-2xl font-semibold text-base transition-all
              flex items-center justify-center gap-2
              ${selectedFormat
                ? "bg-teal text-white shadow-xl shadow-teal/25 active:scale-[0.97]"
                : "bg-sand-200 text-sand-500 cursor-not-allowed"
              }`}
          >
            {selectedFormat ? (
              <>
                {t("cta.choosePhoto")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            ) : (
              t("cta.selectFormat")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
