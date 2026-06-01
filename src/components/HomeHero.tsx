"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/** Renders a headline string where the city is wrapped in *asterisks* → italic. */
function Headline({ text }: { text: string }) {
  return (
    <>
      {text.split("*").map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="italic font-light">
            {part}
          </em>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 w-[84px] text-center">
      <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-teal shadow-md shadow-black/20">
        {icon}
      </div>
      <span className="text-xs font-medium text-white/90 leading-tight">{label}</span>
    </div>
  );
}

export default function HomeHero() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden">
      {/* Background photo */}
      <Image
        src="/hero-bruges.jpg"
        alt="Bruges canal at sunset"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_center]"
      />
      {/* Legibility scrims */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[100svh] flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 px-4 sm:px-8 lg:px-12 pt-4 sm:pt-5">
          <div className="h-11 w-11 sm:h-16 sm:w-16 shrink-0 rounded-full overflow-hidden bg-white shadow-lg shadow-black/30 ring-1 ring-white/40">
            <Image
              src="/logo-pyc.jpg"
              alt="PostYourCard"
              width={160}
              height={160}
              className="h-full w-full object-cover scale-[1.05]"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Hero copy */}
        <main className="flex w-full min-w-0 flex-1 flex-col justify-center px-5 sm:px-8 lg:px-12 pb-10">
          <div className="w-full max-w-xl">
            <h1 className="font-heading text-white font-semibold leading-[1.08] text-[2rem] sm:text-5xl lg:text-6xl">
              <Headline text={t("home.headline")} />
            </h1>

            <p className="mt-5 max-w-md text-base sm:text-lg text-white/85 leading-relaxed">
              {t("home.subtitle")}
            </p>

            <p className="mt-4 font-heading text-white text-3xl sm:text-4xl font-semibold">
              €&nbsp;7,99
              <span className="ml-2 text-white/65 font-normal text-base sm:text-lg align-middle">
                all-in
              </span>
            </p>

            <Link
              href="/order/hotel-brugge"
              className="mt-8 inline-flex items-center gap-2.5 rounded-2xl bg-teal px-7 py-4 text-base font-medium text-white
                shadow-xl shadow-black/30 hover:bg-teal-600 active:scale-[0.98] transition-all"
            >
              <CameraIcon />
              {t("home.cta")}
            </Link>

            {/* Trust badges */}
            <div className="mt-12 flex items-start gap-4 sm:gap-7">
              <Badge icon={<PrintIcon />} label={t("home.badgeFast")} />
              <Badge icon={<GlobeIcon />} label={t("home.badgeWorldwide")} />
              <Badge
                icon={<span className="font-heading font-semibold text-sm">€7.99</span>}
                label={t("home.badgePrice")}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
