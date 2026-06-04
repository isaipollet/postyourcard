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

/**
 * Upload the logo to Cloudinary (SVG→PNG conversion), then fetch the resulting
 * PNG bytes and return them as a `data:image/png;base64,...` URI.
 *
 * Why: Cloudinary's librsvg SVG→PNG converter renders PNG data-URIs inside
 * <image> tags reliably, but NOT SVG data-URIs or external http URLs.
 */
async function getLogoPngDataUri(
  logoUrl: string,
  cld: typeof cloudinary
): Promise<string | null> {
  try {
    // 1. Upload logo to Cloudinary — it converts SVG → PNG automatically.
    const logoHash = Buffer.from(logoUrl)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 40);
    const logoPublicId = `postyourcard-logos/${logoHash}`;

    const upload = await cld.uploader.upload(logoUrl, {
      public_id: logoPublicId,
      overwrite: true,
      resource_type: "image",
      format: "png",
    });

    // 2. Fetch the Cloudinary PNG and base64-encode it.
    const pngRes = await fetch(upload.secure_url);
    if (!pngRes.ok) return null;
    const buf = await pngRes.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } catch (err) {
    console.error("[postcard-back] logo PNG fetch failed:", err);
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
  // If a logo URL is provided, convert it to a PNG data-URI via Cloudinary.
  // librsvg (used by Cloudinary) renders PNG data-URIs in SVG <image> tags reliably.
  let logoDataUri: string | null = null;
  if (data.logoUrl) {
    logoDataUri = await getLogoPngDataUri(data.logoUrl, cloudinary);
    console.log("[postcard-back] logoDataUri obtained:", logoDataUri ? `${logoDataUri.slice(0, 60)}…` : "null");
  }

  // Build SVG with the logo PNG embedded as a data-URI (or without logo if fetch failed)
  const svgString = buildSvg({ ...data, logoDataUri });
  const base64 = Buffer.from(svgString, "utf8").toString("base64");
  const dataUri = `data:image/svg+xml;base64,${base64}`;

  const publicId = `postyourcard-backs/${data.orderReference.replace(/[^a-zA-Z0-9_-]/g, "_")}-back`;

  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: "image",
    public_id: publicId,
    overwrite: true,
    format: "png",
    quality: 90,
  });

  return result.secure_url;
}

/**
 * Takes the cropped front photo (already in Cloudinary) and overlays the hotel
 * logo in the top-left corner using Cloudinary URL transformations.
 *
 * Returns a new Cloudinary URL with the logo baked in, ready to attach as the
 * print-ready front. Falls back to the original URL if anything fails.
 */
export async function generateFrontWithLogoUrl(
  croppedImageUrl: string,
  logoUrl: string
): Promise<string> {
  try {
    // 1. Upload logo to Cloudinary as PNG (idempotent — same hash = same public_id)
    const logoHash = Buffer.from(logoUrl)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 40);
    const logoPublicId = `postyourcard-logos/${logoHash}`;

    await cloudinary.uploader.upload(logoUrl, {
      public_id: logoPublicId,
      overwrite: false,   // skip if already uploaded
      resource_type: "image",
      format: "png",
    });

    // 2. Extract the photo's public_id from its Cloudinary URL.
    //    URL shape: https://res.cloudinary.com/{cloud}/image/upload/{version?}/{publicId}.{ext}
    const match = croppedImageUrl.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/);
    if (!match) return croppedImageUrl;
    const photoPublicId = match[1];

    // 3. Build a Cloudinary transformation URL:
    //    overlay the logo top-left (north_west), max width 220px, 85% opacity.
    //    Cloudinary overlay syntax: replace '/' with ':' in public_id.
    const overlayId = logoPublicId.replace(/\//g, ":");
    const transformedUrl = cloudinary.url(photoPublicId, {
      transformation: [
        {
          overlay: overlayId,
          gravity: "north_west",
          x: 30,
          y: 30,
          width: 220,
          crop: "fit",
          opacity: 85,
        },
        { flags: "layer_apply" },
      ],
      format: "jpg",
      quality: 90,
      secure: true,
    });

    return transformedUrl;
  } catch (err) {
    console.error("[postcard-front] logo overlay failed:", err);
    return croppedImageUrl; // fallback to original
  }
}
