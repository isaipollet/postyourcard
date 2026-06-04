/**
 * Generates a print-ready PNG of the postcard back side by:
 *   1. Building a plain SVG string (no WASM, no extra packages)
 *   2. Uploading it to Cloudinary, which converts SVG → PNG at 300dpi quality
 *   3. Returning the secure PNG URL (used as Resend `path` attachment)
 *
 * Falls back gracefully: caller wraps in try/catch so email still sends
 * even if this step fails.
 */

import { cloudinary } from "@/lib/cloudinary-server";

interface BackData {
  orderReference: string;
  message: string;
  recipientName: string;
  recipientStreet: string;
  recipientPostal: string;
  recipientCity: string;
  recipientCountry: string;
  formatKey: "standard" | "standard-v" | "large" | "large-v";
  logoUrl?: string | null;       // external URL — converted to data-URI before SVG build
  logoDataUri?: string | null;   // base64 data-URI used inside SVG builders
}

// ── helpers ──────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Wraps plain text into lines that fit within `maxChars` columns.
 * Honours explicit newlines in the original string.
 */
function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word; // single word longer than limit → allow it
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

// ── Landscape SVG (left: message, right: address) ────────────────────────────

function buildLogoSvg(logoDataUri: string | null | undefined, x: number, y: number, maxW: number, maxH: number): string {
  if (!logoDataUri) return "";
  return `  <image href="${escapeXml(logoDataUri)}" x="${x}" y="${y}" width="${maxW}" height="${maxH}" preserveAspectRatio="xMinYMid meet" opacity="0.9"/>`;
}

/** Fetch an external image URL and return it as a base64 data-URI so it can be
 *  embedded directly in the SVG — Cloudinary cannot fetch external URLs during
 *  SVG→PNG conversion, so we must inline the image bytes. */
async function fetchLogoAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = await res.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    // Normalise SVG mime type
    const mime = contentType.includes("svg") ? "image/svg+xml" : contentType.split(";")[0];
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

function buildLandscapeSvg(data: BackData, W: number, H: number): string {
  // Scale factor for wider panoramic format
  const s = W > 2000 ? 1.3 : 1;

  const pad = Math.round(52 * s);
  const divX = Math.round(W * 0.47); // vertical divider between message ↔ address

  const szLabel   = Math.round(20 * s);
  const szMessage = Math.round(32 * s);
  const szFooter  = Math.round(16 * s);
  const szName    = Math.round(40 * s);
  const szAddr    = Math.round(34 * s);
  const szCountry = Math.round(30 * s);

  // Message word-wrap
  const msgAreaW = divX - pad * 2;
  const charsPerLine = Math.max(18, Math.floor(msgAreaW / (szMessage * 0.56)));
  const msgLines = wrapText(data.message, charsPerLine);

  const msgStartY  = pad + szLabel + Math.round(36 * s);
  const msgLineH   = Math.round(szMessage * 1.65);
  const messageSvg = msgLines
    .map((line, i) =>
      `  <text x="${pad}" y="${msgStartY + i * msgLineH}" ` +
      `font-family="Liberation Sans,Arial,Helvetica,sans-serif" ` +
      `font-size="${szMessage}" fill="#2a1f1f">${escapeXml(line)}</text>`
    )
    .join("\n");

  // Right-side geometry
  const rightPad = divX + pad;
  const stampW = Math.round(86 * s);
  const stampH = Math.round(104 * s);
  const stampX = W - pad - stampW;
  const stampY = pad;

  const line1Y = stampY + stampH + Math.round(28 * s);
  const line2Y = line1Y + Math.round(22 * s);
  const addrY   = line2Y + Math.round(52 * s);
  const addrLnH = Math.round(szAddr * 1.5);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- background -->
  <rect width="${W}" height="${H}" fill="#fffef9"/>
  <rect width="${W}" height="${H}" fill="none" stroke="#cccccc" stroke-width="2"/>

  <!-- vertical divider -->
  <line x1="${divX}" y1="32" x2="${divX}" y2="${H - 32}" stroke="#aaaaaa" stroke-width="1"/>

  <!-- LEFT: section label -->
  <text x="${pad}" y="${pad + szLabel}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szLabel}" fill="#999999" letter-spacing="4">PERSONAL MESSAGE</text>

  <!-- LEFT: message body -->
${messageSvg}

  <!-- LEFT: footer -->
  <text x="${pad}" y="${H - pad}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szFooter}" fill="#cccccc">PostYourCard.com · Bruges, Belgium</text>

  <!-- RIGHT: stamp placeholder -->
  <rect x="${stampX}" y="${stampY}" width="${stampW}" height="${stampH}"
    fill="none" stroke="#bbbbbb" stroke-width="2" stroke-dasharray="8,5"/>

  <!-- RIGHT: address guide lines -->
  <line x1="${rightPad}" y1="${line1Y}" x2="${W - pad}" y2="${line1Y}" stroke="#cccccc" stroke-width="1"/>
  <line x1="${rightPad}" y1="${line2Y}" x2="${W - pad}" y2="${line2Y}" stroke="#cccccc" stroke-width="1"/>

  <!-- RIGHT: recipient name -->
  <text x="${rightPad}" y="${addrY}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szName}" font-weight="bold" fill="#1a1a1a">${escapeXml(data.recipientName)}</text>

  <!-- RIGHT: street -->
  <text x="${rightPad}" y="${addrY + addrLnH}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szAddr}" fill="#1a1a1a">${escapeXml(data.recipientStreet)}</text>

  <!-- RIGHT: postal + city -->
  <text x="${rightPad}" y="${addrY + addrLnH * 2}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szAddr}" fill="#1a1a1a">${escapeXml(`${data.recipientPostal} ${data.recipientCity}`)}</text>

  <!-- RIGHT: country -->
  <text x="${rightPad}" y="${addrY + addrLnH * 3}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szCountry}" font-weight="bold" fill="#1a1a1a"
    letter-spacing="3">${escapeXml(data.recipientCountry.toUpperCase())}</text>

  <!-- BOTTOM-RIGHT: hotel logo -->
${buildLogoSvg(data.logoDataUri, W - pad - Math.round(220 * s), H - pad - Math.round(100 * s), Math.round(220 * s), Math.round(100 * s))}
</svg>`;
}

// ── Portrait SVG (top: message, bottom: address) ─────────────────────────────

function buildPortraitSvg(data: BackData, W: number, H: number): string {
  // Scale factor for taller panoramic portrait
  const s = H > 2000 ? 1.3 : 1;

  const pad  = Math.round(52 * s);
  const divY = Math.round(H * 0.45); // horizontal divider

  const szLabel   = Math.round(20 * s);
  const szMessage = Math.round(32 * s);
  const szFooter  = Math.round(16 * s);
  const szName    = Math.round(40 * s);
  const szAddr    = Math.round(34 * s);
  const szCountry = Math.round(30 * s);

  // Message word-wrap — available width = full card width minus pads
  const msgAreaW     = W - pad * 2;
  const charsPerLine = Math.max(18, Math.floor(msgAreaW / (szMessage * 0.56)));
  const msgLines     = wrapText(data.message, charsPerLine);

  const msgStartY  = pad + szLabel + Math.round(36 * s);
  const msgLineH   = Math.round(szMessage * 1.65);
  const messageSvg = msgLines
    .map((line, i) =>
      `  <text x="${pad}" y="${msgStartY + i * msgLineH}" ` +
      `font-family="Liberation Sans,Arial,Helvetica,sans-serif" ` +
      `font-size="${szMessage}" fill="#2a1f1f">${escapeXml(line)}</text>`
    )
    .join("\n");

  // Bottom area: stamp, guide lines, address
  const stampW = Math.round(86 * s);
  const stampH = Math.round(104 * s);
  const stampX = W - pad - stampW;
  const stampY = divY + pad;

  const line1Y  = stampY + stampH + Math.round(28 * s);
  const line2Y  = line1Y + Math.round(22 * s);
  const addrY   = line2Y + Math.round(52 * s);
  const addrLnH = Math.round(szAddr * 1.5);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- background -->
  <rect width="${W}" height="${H}" fill="#fffef9"/>
  <rect width="${W}" height="${H}" fill="none" stroke="#cccccc" stroke-width="2"/>

  <!-- horizontal divider -->
  <line x1="32" y1="${divY}" x2="${W - 32}" y2="${divY}" stroke="#aaaaaa" stroke-width="1"/>

  <!-- TOP: section label -->
  <text x="${pad}" y="${pad + szLabel}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szLabel}" fill="#999999" letter-spacing="4">PERSONAL MESSAGE</text>

  <!-- TOP: message body -->
${messageSvg}

  <!-- TOP: footer -->
  <text x="${pad}" y="${divY - Math.round(pad * 0.5)}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szFooter}" fill="#cccccc">PostYourCard.com · Bruges, Belgium</text>

  <!-- BOTTOM: stamp placeholder -->
  <rect x="${stampX}" y="${stampY}" width="${stampW}" height="${stampH}"
    fill="none" stroke="#bbbbbb" stroke-width="2" stroke-dasharray="8,5"/>

  <!-- BOTTOM: address guide lines -->
  <line x1="${pad}" y1="${line1Y}" x2="${stampX - Math.round(20 * s)}" y2="${line1Y}" stroke="#cccccc" stroke-width="1"/>
  <line x1="${pad}" y1="${line2Y}" x2="${stampX - Math.round(20 * s)}" y2="${line2Y}" stroke="#cccccc" stroke-width="1"/>

  <!-- BOTTOM: recipient name -->
  <text x="${pad}" y="${addrY}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szName}" font-weight="bold" fill="#1a1a1a">${escapeXml(data.recipientName)}</text>

  <!-- BOTTOM: street -->
  <text x="${pad}" y="${addrY + addrLnH}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szAddr}" fill="#1a1a1a">${escapeXml(data.recipientStreet)}</text>

  <!-- BOTTOM: postal + city -->
  <text x="${pad}" y="${addrY + addrLnH * 2}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szAddr}" fill="#1a1a1a">${escapeXml(`${data.recipientPostal} ${data.recipientCity}`)}</text>

  <!-- BOTTOM: country -->
  <text x="${pad}" y="${addrY + addrLnH * 3}"
    font-family="Liberation Sans,Arial,Helvetica,sans-serif"
    font-size="${szCountry}" font-weight="bold" fill="#1a1a1a"
    letter-spacing="3">${escapeXml(data.recipientCountry.toUpperCase())}</text>

  <!-- BOTTOM-RIGHT: hotel logo -->
${buildLogoSvg(data.logoDataUri, W - pad - Math.round(220 * s), H - pad - Math.round(100 * s), Math.round(220 * s), Math.round(100 * s))}
</svg>`;
}

// ── SVG dispatcher ────────────────────────────────────────────────────────────

function buildSvg(data: BackData): string {
  // Print dimensions at 300 dpi (mm / 25.4 * 300, rounded)
  const dims: Record<BackData["formatKey"], { W: number; H: number }> = {
    standard:    { W: 1748, H: 1240 }, // 148 × 105 mm — landscape
    "standard-v": { W: 1240, H: 1748 }, // 105 × 148 mm — portrait
    large:       { W: 2480, H: 1169 }, // 210 × 99 mm  — landscape
    "large-v":   { W: 1169, H: 2480 }, // 99 × 210 mm  — portrait
  };

  const { W, H } = dims[data.formatKey];
  const isPortrait = data.formatKey === "standard-v" || data.formatKey === "large-v";

  return isPortrait
    ? buildPortraitSvg(data, W, H)
    : buildLandscapeSvg(data, W, H);
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Generates the postcard back as a Cloudinary PNG and returns its secure URL.
 * Upload is idempotent: same `public_id` overwrites the previous version.
 */
export async function generatePostcardBackUrl(data: BackData): Promise<string> {
  // Pre-fetch logo as base64 data-URI so Cloudinary can embed it during SVG→PNG conversion
  if (data.logoUrl && !data.logoDataUri) {
    data = { ...data, logoDataUri: await fetchLogoAsDataUri(data.logoUrl) };
  }

  const svgString = buildSvg(data);
  const base64 = Buffer.from(svgString, "utf8").toString("base64");
  const dataUri = `data:image/svg+xml;base64,${base64}`;

  // Safe public_id (no special chars)
  const publicId = `postyourcard-backs/${data.orderReference.replace(/[^a-zA-Z0-9_-]/g, "_")}-back`;

  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: "image",
    public_id: publicId,
    overwrite: true,
    format: "png",          // Cloudinary converts SVG → PNG on ingest
    quality: 90,
  });

  return result.secure_url;
}
