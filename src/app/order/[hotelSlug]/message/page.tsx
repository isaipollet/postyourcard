"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import { useOrderStore } from "@/store/order";
import { FORMATS } from "@/lib/constants";
import { COUNTRIES } from "@/lib/countries";
import { hapticTap } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const MAX_MESSAGE_LENGTH = 300;

export default function MessagePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.hotelSlug as string;

  const { selectedFormat, croppedImageUrl, message, messageFont, customerEmail, address, hotelLogoUrl, setMessage, setMessageFont, setCustomerEmail, setAddress } =
    useOrderStore();
  const { t } = useLanguage();

  const FONTS: { key: typeof messageFont; className: string }[] = [
    { key: "caveat", className: "font-handwritten" },
    { key: "patrick-hand", className: "font-hand-print" },
    { key: "dancing-script", className: "font-hand-cursive" },
    { key: "kalam", className: "font-hand-pen" },
  ];
  const activeFont = FONTS.find((f) => f.key === messageFont)?.className || "font-handwritten";

  useEffect(() => {
    if (!selectedFormat || !croppedImageUrl) {
      router.replace(`/order/${slug}`);
    }
  }, [selectedFormat, croppedImageUrl, router, slug]);

  useEffect(() => {
    if (!address.country) {
      setAddress({ country: "BE" });
    }
  }, [address.country, setAddress]);

  if (!selectedFormat || !croppedImageUrl) return null;

  const format = FORMATS[selectedFormat];
  const isAddressComplete =
    address.name.trim() &&
    address.street.trim() &&
    address.postalCode.trim() &&
    address.city.trim() &&
    address.country;

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
  const canProceed = message.trim().length > 0 && isAddressComplete && isValidEmail;

  const handleNext = () => {
    if (!canProceed) return;
    hapticTap();
    router.push(`/order/${slug}/checkout`);
  };

  return (
    <div className="page-fade-in">
      <ProgressBar currentStep={3} />

      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <button
          onClick={() => router.push(`/order/${slug}/upload`)}
          className="self-start flex items-center gap-1.5 text-sm text-sand-600 font-medium
            px-3 py-1.5 rounded-full bg-white border border-sand-200 shadow-sm
            hover:border-teal/30 hover:text-teal hover:shadow-md active:scale-[0.97] transition-all mt-2 mb-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("common.back")}
        </button>

        <h1 className="font-heading text-xl font-medium text-gray-900 mt-2 mb-1">
          {t("message.title")}
        </h1>
        <p className="text-sm text-sand-500 mb-5">{t("message.subtitle")}</p>

        <div className="w-full space-y-5" style={{ maxWidth: format.containerMaxWidth }}>
          {/* ── Message textarea ── */}
          <div>
            <label htmlFor="message" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              {t("message.label")}
              <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              placeholder={t("message.placeholder")}
              rows={5}
              className="textarea-lined w-full px-4 rounded-2xl border border-sand-200 bg-white text-gray-900
                placeholder:text-sand-400 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20
                resize-none font-body text-[15px] shadow-sm transition-all"
            />
            <div className="flex justify-between items-center mt-1 px-1">
              <span className="text-[10px] text-sand-400">{t("message.hint")}</span>
              <span
                className={`text-xs tabular-nums transition-colors ${
                  message.length >= MAX_MESSAGE_LENGTH
                    ? "text-red-500 font-bold"
                    : message.length > MAX_MESSAGE_LENGTH * 0.9
                    ? "text-amber-600 font-medium"
                    : "text-sand-400"
                }`}
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>

            {/* ── Handwriting style picker ── */}
            <div className="mt-3">
              <p className="text-[10px] font-medium text-sand-500 uppercase tracking-wide mb-2">
                {t("font.label")}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {FONTS.map((f) => {
                  const active = messageFont === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => { hapticTap(); setMessageFont(f.key); }}
                      className={`flex flex-col items-center gap-1 py-2 px-2 rounded-xl border transition-all ${
                        active
                          ? "border-teal bg-teal/[0.06] shadow-sm"
                          : "border-sand-200 bg-white hover:border-sand-300"
                      }`}
                    >
                      <span className={`${f.className} text-xl leading-none ${active ? "text-teal" : "text-gray-700"}`}>
                        Aa
                      </span>
                      <span className={`text-[9px] uppercase tracking-wide ${active ? "text-teal font-semibold" : "text-sand-500"}`}>
                        {t(`font.${f.key}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Live postcard preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-sand-200 shadow-md overflow-hidden"
          >
            {/* Front side — photo thumbnail */}
            <div
              className="relative w-full overflow-hidden bg-sand-50"
              style={{ aspectRatio: format.aspectRatio }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={croppedImageUrl}
                alt="Your photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2">
                <span className="text-[10px] font-medium text-gray-800 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                  {t(`format.${format.family}.name`)}{format.orientation === "vertical" ? ` (${t("format.orientation.vertical")})` : ""} · {format.dimensions}
                </span>
              </div>
            </div>

            {/* Back side preview — live updating */}
            <div className="p-3 border-t border-dashed border-sand-200">
              <div className="flex gap-3">
                {/* Message area */}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-sand-400 uppercase tracking-widest mb-1">{t("message.previewLabel")}</p>
                  <p className={`${activeFont} text-[15px] text-gray-700 leading-snug min-h-[40px] break-words overflow-hidden`}>
                    {message || <span className="text-sand-300 not-italic font-body text-[11px]">{t("message.previewPlaceholder")}</span>}
                  </p>
                </div>
                {/* Divider */}
                <div className="w-px bg-sand-200 self-stretch" />
                {/* Address area */}
                <div className="w-[140px] flex-shrink-0 flex flex-col">
                  {/* Stamp — top right */}
                  <div className="w-6 h-7 border border-teal/30 rounded-[2px] bg-gradient-to-br from-teal/15 to-teal/5 ml-auto mb-2 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal/40" />
                  </div>

                  {/* TO label */}
                  <p className="text-[8px] text-sand-400 uppercase tracking-[0.2em] mb-1">To</p>

                  {/* Address — handwritten font, centered vertically */}
                  <div className="flex-1 space-y-1">
                    <p className="font-handwritten text-[14px] text-gray-800 leading-tight break-words">
                      {address.name || <span className="text-sand-300 font-body text-[10px] not-italic">{t("address.namePlaceholder")}</span>}
                    </p>
                    <p className="font-handwritten text-[12px] text-gray-700 leading-tight break-words">
                      {address.street || <span className="text-sand-300 font-body text-[9px] not-italic">{t("address.streetShort")}</span>}
                    </p>
                    <p className="font-handwritten text-[12px] text-gray-700 leading-tight break-words">
                      {address.postalCode || address.city
                        ? `${address.postalCode} ${address.city}`.trim()
                        : <span className="text-sand-300 font-body text-[9px] not-italic">{t("address.cityShort")}</span>
                      }
                    </p>
                    {address.country && (
                      <p className="text-[9px] text-sand-700 font-bold uppercase tracking-[0.15em] leading-tight pt-0.5">
                        {COUNTRIES.find((c) => c.code === address.country)?.name || address.country}
                      </p>
                    )}
                  </div>

                  {/* Hotel logo — bottom right of preview */}
                  {hotelLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hotelLogoUrl}
                      alt=""
                      className="mt-2 h-6 max-w-[80px] object-contain self-end ml-auto opacity-80"
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Address section ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-sand-50 to-sand-100/50 rounded-2xl p-5 border border-sand-200 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-base font-medium text-gray-900">
                  {t("address.title")}
                </h2>
                <p className="text-[10px] text-sand-500">{t("address.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <InputField
                id="recipient-name"
                label={t("address.recipientName")}
                value={address.name}
                onChange={(v) => setAddress({ name: v })}
                placeholder={t("address.recipientPlaceholder")}
              />
              <InputField
                id="street"
                label={t("address.street")}
                value={address.street}
                onChange={(v) => setAddress({ street: v })}
                placeholder={t("address.streetPlaceholder")}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="postal-code"
                  label={t("address.postalCode")}
                  value={address.postalCode}
                  onChange={(v) => setAddress({ postalCode: v })}
                  placeholder={t("address.postalCodePlaceholder")}
                />
                <InputField
                  id="city"
                  label={t("address.city")}
                  value={address.city}
                  onChange={(v) => setAddress({ city: v })}
                  placeholder={t("address.cityPlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-xs font-medium text-sand-600 mb-1.5 uppercase tracking-wide">
                  {t("address.country")}
                  <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <select
                  id="country"
                  value={address.country}
                  onChange={(e) => setAddress({ country: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-sand-200 bg-white text-gray-900
                    focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20
                    text-sm appearance-none shadow-sm min-h-[48px] transition-all
                    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B1F2A%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
                    bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
                >
                  <option value="">{t("address.selectCountry")}</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* ── Email ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="email" className="block text-xs font-medium text-sand-600 mb-1.5 uppercase tracking-wide">
              {t("email.label")}
              <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              <span className="normal-case tracking-normal font-normal ml-1">{t("email.suffix")}</span>
            </label>
            <input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder={t("email.placeholder")}
              className="w-full px-4 py-3 rounded-2xl border border-sand-200 bg-white text-gray-900
                placeholder:text-sand-400 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20
                text-sm min-h-[48px] shadow-sm transition-all"
            />
          </motion.div>

          {/* ── CTA ── */}
          <motion.button
            onClick={handleNext}
            disabled={!canProceed}
            whileTap={canProceed ? { scale: 0.97 } : undefined}
            className={`w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all
              flex items-center justify-center gap-2
              ${canProceed
                ? "bg-teal text-white shadow-xl shadow-teal/25"
                : "bg-sand-200 text-sand-500 cursor-not-allowed"
              }`}
          >
            {canProceed ? (
              <>
                {t("message.cta")}
                <motion.svg
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </motion.svg>
              </>
            ) : (
              t("message.ctaDisabled")
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-sand-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-sand-200 bg-white text-gray-900
          placeholder:text-sand-400 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20
          text-sm min-h-[48px] shadow-sm transition-all"
      />
    </div>
  );
}
