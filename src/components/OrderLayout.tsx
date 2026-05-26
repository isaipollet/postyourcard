"use client";

import { useEffect, useState } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <OrderLayoutInner>{children}</OrderLayoutInner>
    </LanguageProvider>
  );
}

function OrderLayoutInner({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-x-hidden">
      {/* Ambient background blobs — fixed, behind everything */}
      <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
        {/* Teal glow — top left */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #6B1F2A 0%, transparent 70%)",
            top: "-100px",
            left: "-150px",
          }}
        />
        {/* Gold glow — top right */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, #C9963A 0%, transparent 70%)",
            top: "200px",
            right: "-100px",
          }}
        />
        {/* Teal glow — bottom center */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, #6B1F2A 0%, transparent 70%)",
            bottom: "-200px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <header
        className={`sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md flex items-center justify-between gap-2 px-3 sm:px-4 py-3 transition-all duration-200 ${
          scrolled ? "shadow-sm shadow-sand-300/30" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="w-5 h-5 text-teal flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 8h20" />
            <rect x="14" y="10" width="5" height="4" rx="0.5" strokeDasharray="2 1" />
            <line x1="4" y1="14" x2="10" y2="14" />
            <line x1="4" y1="16.5" x2="8" y2="16.5" />
          </svg>
          <span className="font-heading text-base sm:text-lg font-medium text-teal tracking-tight truncate">
            PostYourCard
          </span>
        </div>
        <LanguageSwitcher />
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
