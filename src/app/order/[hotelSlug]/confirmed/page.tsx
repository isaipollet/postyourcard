"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrderStore } from "@/store/order";
import { hapticSuccess } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { FORMATS } from "@/lib/constants";

export default function ConfirmedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.hotelSlug as string;
  const orderRef = searchParams.get("ref") || "PYC-XXXXXX";

  const reset = useOrderStore((s) => s.reset);
  const croppedImageUrl = useOrderStore((s) => s.croppedImageUrl);
  const selectedFormat = useOrderStore((s) => s.selectedFormat);
  const format = selectedFormat ? FORMATS[selectedFormat] : FORMATS.standard;
  const { t } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    hapticSuccess();
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center px-4 pb-8 pt-6 text-center page-fade-in relative overflow-hidden">
      {/* Confetti burst */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                y: -20,
                rotate: 0,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                y: "100vh",
                rotate: 360 + Math.random() * 360,
                opacity: 0,
                scale: 0.5,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.8,
                ease: "easeOut",
              }}
              className="absolute"
              style={{
                left: `${5 + Math.random() * 90}%`,
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                backgroundColor: [
                  "#6B1F2A", "#F5E6C8", "#B5832E", "#6B1F2A",
                  "#E25C5C", "#FAF0D7", "#3B82F6", "#6B1F2A",
                ][i % 8],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}

      {/* Postcard with real photo */}
      <motion.div
        initial={{ y: 20, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative mb-8"
        style={{ width: format.key === "large" ? "min(580px, 88vw)" : "min(440px, 88vw)" }}
      >
        <motion.div
          animate={{ y: [-4, 4, -4], rotate: [-1, 1, -1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* The actual postcard with user's photo */}
          <div
            className="w-full bg-white rounded-2xl border border-sand-200 shadow-2xl overflow-hidden relative"
            style={{ aspectRatio: format.aspectRatio }}
          >
            {croppedImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={croppedImageUrl}
                alt="Your postcard"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal/15 to-sand-200/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-teal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6 20.25h12a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
              </div>
            )}

          </div>

          {/* Soft shadow underneath */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[70%] h-3 bg-black/15 rounded-[50%] blur-md" />

          {/* SENT rubber stamp — sticks out from top-left corner of the postcard */}
          <motion.div
            initial={{ scale: 3, rotate: -35, opacity: 0 }}
            animate={{ scale: 1, rotate: -12, opacity: 1 }}
            transition={{
              delay: 0.9,
              duration: 0.35,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="absolute -top-5 -left-6 pointer-events-none"
          >
            <div
              className="border-[3px] border-[#6B1F2A] px-3 py-1.5 rounded-md bg-[#FAF6EE] shadow-lg"
              style={{ letterSpacing: "0.12em" }}
            >
              <div className="font-heading text-[#6B1F2A] font-bold text-2xl uppercase tracking-widest leading-none">
                Sent
              </div>
              <div className="text-[#6B1F2A]/90 text-[8px] font-semibold uppercase tracking-[0.25em] text-center mt-1">
                Bruges · Belgium
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Sent checkmark badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="absolute -bottom-4 -right-4 w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center shadow-xl shadow-teal/30 ring-4 ring-[var(--background)]"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-heading text-[1.6rem] font-medium text-gray-900 mb-2"
      >
        {t("confirmed.title")}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sand-600 text-[15px] mb-6 max-w-xs mx-auto leading-relaxed"
      >
        {t("confirmed.subtitle")}
      </motion.p>

      {/* Delivery timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-xs mx-auto mb-6"
      >
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-8 right-8 h-[2px] bg-sand-200" />
            <div className="absolute top-3 left-8 h-[2px] bg-teal" style={{ width: "20%" }} />

            <TimelineStep icon="print" label={t("confirmed.printingToday")} active />
            <TimelineStep icon="truck" label={t("confirmed.shippedTomorrow")} />
            <TimelineStep icon="home" label={t("confirmed.delivery")} />
          </div>
        </div>
      </motion.div>

      {/* Order reference — boarding pass style */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-xs mx-auto bg-white rounded-2xl border border-sand-200 overflow-hidden mb-8 shadow-sm"
      >
        <div className="bg-gradient-to-r from-teal/[0.06] to-teal/[0.02] px-5 py-3 border-b border-dashed border-sand-200">
          <p className="text-[10px] text-teal/60 uppercase tracking-[0.15em] font-bold">
            {t("confirmed.orderReference")}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="font-heading font-medium text-2xl text-gray-900 tracking-wide tabular-nums">
            {orderRef}
          </p>
          <p className="text-xs text-sand-500 mt-1.5">
            {t("confirmed.emailSent")}
          </p>
        </div>
      </motion.div>

      {/* Send another */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Link
          href={`/order/${slug}`}
          onClick={() => reset()}
          className="inline-flex items-center gap-2 py-4 px-8 rounded-2xl font-semibold text-white bg-teal
            hover:bg-teal-600 active:scale-[0.97] shadow-xl shadow-teal/25 transition-all text-base"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t("confirmed.sendAnother")}
        </Link>
      </motion.div>

      {/* Footer */}
      <p className="mt-auto pt-10 text-[11px] text-sand-400">
        {t("confirmed.footer")}
      </p>
    </div>
  );
}

function TimelineStep({
  icon,
  label,
  active = false,
}: {
  icon: "print" | "truck" | "home";
  label: string;
  active?: boolean;
}) {
  const paths: Record<string, string> = {
    print: "M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z",
    truck: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
    home: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  };

  return (
    <div className="flex flex-col items-center z-10">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center ${
          active ? "bg-teal text-white shadow-sm" : "bg-sand-100 text-sand-500"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={paths[icon]} />
        </svg>
      </div>
      <span className={`text-[10px] mt-1.5 max-w-[70px] leading-tight text-center ${active ? "text-teal font-semibold" : "text-sand-500"}`}>
        {label}
      </span>
    </div>
  );
}
