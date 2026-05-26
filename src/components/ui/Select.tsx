"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Maak een keuze",
  disabled,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 bg-white text-left transition-all ${
          open
            ? "border-teal shadow-md shadow-teal/10"
            : "border-sand-200 hover:border-sand-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`flex-1 truncate ${
            selected ? "text-gray-900" : "text-sand-400"
          }`}
        >
          {selected ? (
            <span className="flex flex-col">
              <span className="font-medium">{selected.label}</span>
              {selected.hint && (
                <span className="text-xs text-sand-500 truncate">
                  {selected.hint}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <svg
          className={`w-4 h-4 text-sand-500 transition-transform flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-sand-200 bg-white shadow-xl shadow-sand-900/10 py-1"
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sand-400 italic text-center">
                Geen opties
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-teal/[0.08] text-teal"
                        : "hover:bg-sand-50 text-gray-800"
                    }`}
                  >
                    <span className="flex flex-col min-w-0">
                      <span
                        className={`truncate ${
                          isSelected ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {opt.label}
                      </span>
                      {opt.hint && (
                        <span className="text-xs text-sand-500 truncate">
                          {opt.hint}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
