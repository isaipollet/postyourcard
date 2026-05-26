"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, Language, translations } from "./translations";

const STORAGE_KEY = "pyc-lang";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  detectBrowserLanguage = true,
}: {
  children: React.ReactNode;
  /** When false, the default language is kept unless the visitor explicitly picked one. */
  detectBrowserLanguage?: boolean;
}) {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Language | null;
    if (stored && stored in translations) {
      setLangState(stored);
      return;
    }
    if (!detectBrowserLanguage) return;
    const browserLang = typeof navigator !== "undefined" ? navigator.language.slice(0, 2) : "";
    if (browserLang in translations) {
      setLangState(browserLang as Language);
    }
  }, [detectBrowserLanguage]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      const dict = translations[lang] ?? translations[DEFAULT_LANGUAGE];
      let value = dict[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          value = value.replace(`{${k}}`, v);
        }
      }
      return value;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
