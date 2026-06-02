"use client";

import { FormatInfo } from "@/lib/constants";

interface FormatCardProps {
  format: FormatInfo;
  selected: boolean;
  onSelect: () => void;
}

export default function FormatCard({
  format,
  selected,
  onSelect,
}: FormatCardProps) {
  const isLarge = format.family === "large";

  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
        selected
          ? "border-teal bg-teal/[0.03] shadow-lg shadow-teal/10 scale-[1.02]"
          : "border-sand-200 bg-white hover:border-sand-400 hover:shadow-md"
      }`}
    >
      {/* Selected checkmark badge */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal rounded-full flex items-center justify-center shadow-md">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Postcard mockup shape */}
        <div
          className={`flex-shrink-0 rounded-md bg-gradient-to-br from-sand-100 to-sand-200 border border-sand-300 relative overflow-hidden transition-transform duration-300 ${
            selected ? "shadow-md" : "shadow-sm"
          }`}
          style={{
            width: isLarge ? 96 : 64,
            height: isLarge ? 46 : 80,
            transform: isLarge ? "rotate(-2deg)" : "rotate(2deg)",
          }}
        >
          {/* Faint stamp in corner */}
          <div
            className="absolute top-1 right-1 rounded-[2px] border border-sand-400/40"
            style={{
              width: isLarge ? 14 : 12,
              height: isLarge ? 16 : 14,
            }}
          >
            <div className="w-full h-full bg-teal/10 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-teal/30" />
            </div>
          </div>
          {/* Faint address lines */}
          <div
            className={`absolute ${
              isLarge ? "bottom-1.5 right-2" : "bottom-2 left-2"
            } space-y-1`}
          >
            <div
              className="h-[1px] bg-sand-400/30 rounded"
              style={{ width: isLarge ? 36 : 28 }}
            />
            <div
              className="h-[1px] bg-sand-400/30 rounded"
              style={{ width: isLarge ? 28 : 20 }}
            />
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-gray-900 text-base">
            {format.name}
          </h3>
          <p className="text-sm text-sand-700 mt-0.5">{format.dimensions}</p>
          <p className="text-xs text-sand-600 mt-1 leading-relaxed">
            {format.description}
          </p>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <span className="font-heading font-medium text-teal text-xl">
            {format.price}
          </span>
          <p className="text-[10px] text-sand-600 mt-0.5">shipping included</p>
        </div>
      </div>
    </button>
  );
}
