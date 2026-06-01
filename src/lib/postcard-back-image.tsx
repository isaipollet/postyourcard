/**
 * Generates a print-ready PNG of the postcard back side using next/og (satori).
 * Returns a Buffer that can be attached to an email.
 */
import { ImageResponse } from "next/og";
import React from "react";

interface BackData {
  message: string;
  recipientName: string;
  recipientStreet: string;
  recipientPostal: string;
  recipientCity: string;
  recipientCountry: string;
  formatKey: "standard" | "large";
}

// Module-level cache so we don't re-fetch the font on every email
let fontData: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;

  // Get the Google Fonts CSS to find the actual WOFF2 file URL
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    }
  ).then((r) => r.text());

  const match = css.match(
    /url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2)\)/
  );
  if (!match?.[1]) throw new Error("Could not extract font URL from Google Fonts CSS");

  const fetched = await fetch(match[1]).then((r) => r.arrayBuffer());
  fontData = fetched;
  return fetched;
}

export async function generatePostcardBackPng(data: BackData): Promise<Buffer> {
  const font = await loadFont();

  // 300 dpi dimensions:
  //   Standard  (148 × 105 mm):  1748 × 1240 px
  //   Panoramic (210 ×  99 mm):  2480 × 1169 px
  const W = data.formatKey === "large" ? 2480 : 1748;
  const H = data.formatKey === "large" ? 1169 : 1240;

  // Scale font sizes proportionally for the wider Panoramic format
  const s = W > 2000 ? 1.3 : 1;
  const fs = {
    label:   Math.round(18 * s),
    message: Math.round(34 * s),
    footer:  Math.round(16 * s),
    name:    Math.round(40 * s),
    address: Math.round(34 * s),
    country: Math.round(30 * s),
  };

  const pad = Math.round(50 * s);

  const element = (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: "#fffef9",
        fontFamily: "DM Sans, sans-serif",
        border: "2px solid #cccccc",
      }}
    >
      {/* ── Left half: personal message ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "48%",
          height: "100%",
          padding: `${pad}px ${pad}px ${pad}px ${Math.round(pad * 0.9)}px`,
          borderRight: "1px solid #aaaaaa",
          backgroundColor: "#fffef9",
        }}
      >
        {/* Section label */}
        <p
          style={{
            margin: "0",
            marginBottom: "16px",
            fontSize: fs.label,
            color: "#999999",
            textTransform: "uppercase",
            letterSpacing: "4px",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Personal message
        </p>

        {/* Message text */}
        <p
          style={{
            margin: "0",
            marginBottom: "auto",
            fontSize: fs.message,
            lineHeight: 1.65,
            color: "#2a1f1f",
            fontFamily: "DM Sans, sans-serif",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {data.message}
        </p>

        {/* Footer */}
        <p
          style={{
            margin: "0",
            fontSize: fs.footer,
            color: "#cccccc",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          PostYourCard.com · Bruges, Belgium
        </p>
      </div>

      {/* ── Right half: stamp + address ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "52%",
          height: "100%",
          padding: `${Math.round(pad * 0.8)}px ${pad}px ${pad}px ${pad}px`,
        }}
      >
        {/* Stamp placeholder — top right */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: `${Math.round(pad * 0.55)}px`,
          }}
        >
          <div
            style={{
              width: Math.round(90 * s),
              height: Math.round(108 * s),
              border: "2px dashed #bbbbbb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </div>

        {/* Two address guide lines */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${Math.round(16 * s)}px`,
            marginBottom: `${Math.round(32 * s)}px`,
          }}
        >
          <div style={{ height: 1, backgroundColor: "#cccccc", width: "100%" }} />
          <div style={{ height: 1, backgroundColor: "#cccccc", width: "100%" }} />
        </div>

        {/* Recipient address */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: `${Math.round(8 * s)}px` }}
        >
          <p
            style={{
              margin: "0",
              fontSize: fs.name,
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.3,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {data.recipientName}
          </p>
          <p
            style={{
              margin: "0",
              fontSize: fs.address,
              color: "#1a1a1a",
              lineHeight: 1.3,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {data.recipientStreet}
          </p>
          <p
            style={{
              margin: "0",
              fontSize: fs.address,
              color: "#1a1a1a",
              lineHeight: 1.3,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {data.recipientPostal} {data.recipientCity}
          </p>
          <p
            style={{
              margin: "0",
              fontSize: fs.country,
              fontWeight: 700,
              color: "#1a1a1a",
              textTransform: "uppercase",
              letterSpacing: "3px",
              lineHeight: 1.3,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {data.recipientCountry}
          </p>
        </div>
      </div>
    </div>
  );

  const imageResponse = new ImageResponse(element, {
    width: W,
    height: H,
    fonts: [
      {
        name: "DM Sans",
        data: font,
        weight: 400,
        style: "normal",
      },
    ],
  });

  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
