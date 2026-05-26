"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-0 border border-sand-300/70 rounded-full bg-white/60 backdrop-blur-sm p-0.5 shadow-sm flex-shrink-0">
      {LANGUAGES.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            aria-label={`Switch to ${l.label}`}
            className={`text-[10px] font-semibold tracking-[0.05em] w-7 h-6 sm:w-8 sm:h-7 rounded-full transition-all flex items-center justify-center ${
              active
                ? "bg-teal text-white shadow-sm"
                : "text-sand-700 hover:text-teal"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
