import { Resend } from "resend";
import { generatePostcardBackUrl, generateFrontWithLogoUrl } from "@/lib/postcard-back-image";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

const FROM_EMAIL = "PostYourCard <info@postyourcard.com>";
const OWNER_EMAIL = "info@postyourcard.com";

interface OrderEmailData {
  orderReference: string;
  customerEmail: string;
  recipientName: string;
  recipientStreet: string;
  recipientPostal: string;
  recipientCity: string;
  recipientCountry: string;
  message: string;
  croppedImageUrl: string;
  format: string;
  formatKey: "standard" | "standard-v" | "large" | "large-v";
  formatDimensions: string;
  hotelName: string;
  hotelEmail: string;
  hotelCity?: string | null;
  hotelLogoUrl?: string | null;
  commissionCents: number;
  priceCents: number;
}

export interface EmailSendResult {
  customer: boolean;
  owner: boolean;
}

export async function sendOrderEmails(
  data: OrderEmailData
): Promise<EmailSendResult> {
  const price = (data.priceCents / 100).toFixed(2);
  const commission = (data.commissionCents / 100).toFixed(2);

  const cityFromHotel = (data.hotelCity ?? "").trim();
  const totalPaid = `€&nbsp;${price.replace(".", ",")}`;

  // Generate front photo with logo overlay (top-left) — fail-safe
  let frontUrl: string = data.croppedImageUrl;
  if (data.hotelLogoUrl) {
    try {
      frontUrl = await generateFrontWithLogoUrl(data.croppedImageUrl, data.hotelLogoUrl);
    } catch (err) {
      console.error("Failed to generate front with logo overlay:", err);
    }
  }

  // Generate postcard back PNG via Cloudinary — fail-safe (email still sends without it)
  let backPngUrl: string | null = null;
  try {
    backPngUrl = await generatePostcardBackUrl({
      orderReference: data.orderReference,
      message: data.message,
      recipientName: data.recipientName,
      recipientStreet: data.recipientStreet,
      recipientPostal: data.recipientPostal,
      recipientCity: data.recipientCity,
      recipientCountry: data.recipientCountry,
      formatKey: data.formatKey,
      logoUrl: data.hotelLogoUrl,
    });
  } catch (err) {
    console.error("Failed to generate postcard back PNG:", err);
  }

  // Safe filename base (no special chars)
  const safeRef = data.orderReference.replace(/[^a-zA-Z0-9_-]/g, "_");

  const results = await Promise.allSettled([
    // 1. Customer confirmation — burgundy banner + Cormorant Garamond + 2-col order card
    resend.emails.send({
      from: FROM_EMAIL,
      to: [data.customerEmail],
      subject: `Your postcard is on its way! (${data.orderReference})`,
      html: customerEmailHtml({
        recipientName: data.recipientName,
        recipientCity: data.recipientCity,
        recipientCountry: data.recipientCountry,
        orderReference: data.orderReference,
        format: data.format,
        totalPaid,
        cityFromHotel,
      }),
    }),

    // 2. Fulfillment email to owner — HTML body + JPEG front + PNG back as attachments
    resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `[PRINT] ${data.orderReference} — ${data.format} for ${data.recipientCity}, ${data.recipientCountry}`,
      attachments: [
        // Front photo — with logo overlay if hotel has a logo
        {
          filename: `${safeRef}-front.jpg`,
          path: frontUrl,
          contentType: "image/jpeg",
        },
        // Back side — Cloudinary PNG URL (only if generation succeeded)
        ...(backPngUrl
          ? [
              {
                filename: `${safeRef}-back.png`,
                path: backPngUrl,
                contentType: "image/png",
              },
            ]
          : []),
      ],
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #6B1F2A; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 20px;">📮 New postcard to print</h2>
            <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">Order ${data.orderReference} · ${data.hotelName}</p>
          </div>

          <div style="border: 2px solid #6B1F2A; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">

            <h3 style="margin: 0 0 8px; color: #6B1F2A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">📐 Format</h3>
            <p style="margin: 0 0 20px; font-size: 16px;"><strong>${data.format}</strong> &mdash; ${data.formatDimensions}</p>

            <h3 style="margin: 0 0 8px; color: #6B1F2A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">🖼 Photo (front)</h3>
            <p style="margin: 0 0 8px;">
              <a href="${data.croppedImageUrl}" target="_blank" style="color: #6B1F2A; font-weight: 600;">⬇ Download high-res photo</a>
            </p>
            <img src="${data.croppedImageUrl}" alt="Postcard photo" style="max-width: 100%; max-height: 300px; border: 1px solid #ddd; border-radius: 4px; display: block; margin-bottom: 20px;" />

            <h3 style="margin: 0 0 8px; color: #6B1F2A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">✉️ Postcard Back (print-ready layout)</h3>
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #cccccc;background:#fffef9;margin-bottom:20px;">
              <tr>
                <td style="width:48%;padding:14px 16px 14px 14px;border-right:1px solid #aaaaaa;vertical-align:top;">
                  <p style="margin:0 0 8px;font-size:9px;color:#999999;text-transform:uppercase;letter-spacing:0.12em;font-family:Arial,sans-serif;">Personal message</p>
                  <p style="margin:0 0 12px;font-style:italic;font-size:13px;line-height:1.7;color:#2a1f1f;font-family:Georgia,serif;white-space:pre-wrap;">${escapeHtml(data.message || "")}</p>
                  <p style="margin:16px 0 0;font-size:8px;color:#bbbbbb;font-family:Arial,sans-serif;">PostYourCard.com &middot; Bruges, Belgium</p>
                </td>
                <td style="width:52%;padding:12px 14px;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:10px;">
                    <tr>
                      <td style="width:100%;"></td>
                      <td style="width:40px;height:48px;border:1px dashed #bbbbbb;text-align:center;vertical-align:middle;font-size:18px;">🏰</td>
                    </tr>
                  </table>
                  <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:10px;">
                    <tr><td style="border-top:1px solid #cccccc;font-size:1px;line-height:4px;">&nbsp;</td></tr>
                    <tr><td style="border-top:1px solid #cccccc;font-size:1px;line-height:4px;">&nbsp;</td></tr>
                  </table>
                  <p style="margin:0;font-size:12px;line-height:1.8;color:#1a1a1a;font-family:'Courier New',Courier,monospace;">
                    <strong>${escapeHtml(data.recipientName)}</strong><br />
                    ${escapeHtml(data.recipientStreet)}<br />
                    ${escapeHtml(data.recipientPostal)} ${escapeHtml(data.recipientCity)}<br />
                    <strong style="text-transform:uppercase;">${escapeHtml(data.recipientCountry)}</strong>
                  </p>
                </td>
              </tr>
            </table>

            <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 20px 0;" />

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 4px 8px 4px 0; color: #666;">Customer email</td><td style="padding: 4px 0;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
              <tr><td style="padding: 4px 8px 4px 0; color: #666;">Total paid</td><td style="padding: 4px 0;">&euro;${price}</td></tr>
              <tr><td style="padding: 4px 8px 4px 0; color: #666;">Hotel commission</td><td style="padding: 4px 0;">&euro;${commission} (${data.hotelName})</td></tr>
              <tr><td style="padding: 4px 8px 4px 0; color: #666;">Order reference</td><td style="padding: 4px 0; font-family: monospace;">${data.orderReference}</td></tr>
            </table>
          </div>
        </div>
      `,
    }),
  ]);

  // Resend SDK returns { data, error } — check for errors explicitly
  const customerResult = results[0];
  const ownerResult = results[1];

  const customerOk = customerResult.status === "fulfilled" &&
    !(customerResult.value as any)?.error;
  const ownerOk = ownerResult.status === "fulfilled" &&
    !(ownerResult.value as any)?.error;

  if (!customerOk) {
    console.error("Customer email failed:",
      customerResult.status === "rejected" ? customerResult.reason : (customerResult.value as any)?.error);
  }
  if (!ownerOk) {
    console.error("Owner email failed:",
      ownerResult.status === "rejected" ? ownerResult.reason : (ownerResult.value as any)?.error);
  }

  return {
    customer: customerOk,
    owner: ownerOk,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface CustomerHtmlInput {
  recipientName: string;
  recipientCity: string;
  recipientCountry: string;
  orderReference: string;
  format: string;
  totalPaid: string;
  cityFromHotel: string;
}

function customerEmailHtml(d: CustomerHtmlInput): string {
  const tagline = d.cityFromHotel
    ? `sent with love from <span style="color:#C9A961;font-style:normal;font-weight:500">${escapeHtml(d.cityFromHotel)}</span>`
    : `sent with love`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Your postcard is on its way</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
@media only screen and (max-width:480px){
  .pyc-title{font-size:20px!important;letter-spacing:0.12em!important;padding-left:0.12em!important}
  .pyc-banner{padding:28px 16px 22px!important}
  .pyc-body{padding:24px 18px 20px!important}
  .pyc-h1{font-size:22px!important}
  .pyc-order-card{padding:16px 18px!important}
  .pyc-col{display:block!important;width:100%!important}
  .pyc-col-right{text-align:left!important;margin-top:14px!important;padding-top:14px!important;border-top:1px solid #E0D4B6!important}
  .pyc-ref-val{font-size:18px!important}
  .pyc-paid-val{font-size:20px!important}
  .pyc-quote{font-size:15px!important}
  .pyc-footer{padding:18px 18px 20px!important}
}
</style>
</head>
<body style="margin:0;padding:20px 12px;background:#e7e0d4;font-family:'Inter',-apple-system,sans-serif;">

<div style="max-width:560px;margin:0 auto;background:#FAF6EE;border-radius:4px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(107,31,42,0.25),0 0 0 1px rgba(0,0,0,0.04);">

  <!-- Burgundy banner -->
  <div class="pyc-banner" style="background:#6B1F2A;padding:34px 24px 26px;text-align:center;">
    <div class="pyc-title" style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A961;font-size:26px;font-weight:600;letter-spacing:0.22em;margin:0 0 10px;line-height:1;padding-left:0.22em;">POSTYOURCARD</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:rgba(255,255,255,0.88);font-size:14px;letter-spacing:0.03em;">
      <span style="color:#C9A961;font-style:normal;font-size:16px;margin-right:8px;">·</span>${tagline}<span style="color:#C9A961;font-style:normal;font-size:16px;margin-left:8px;">·</span>
    </div>
  </div>
  <div style="height:2px;background:#C9A961;"></div>

  <!-- Body -->
  <div class="pyc-body" style="padding:30px 28px 24px;color:#2a1f1f;">
    <h1 class="pyc-h1" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;color:#6B1F2A;font-weight:600;margin:0 auto 8px;letter-spacing:-0.005em;line-height:1.2;text-align:center;">Your postcard is on its way</h1>
    <div style="width:56px;height:1px;background:#C9A961;margin:10px auto 22px;opacity:0.7;"></div>

    <p style="font-size:15px;line-height:1.65;color:#3d2e2e;margin:0 0 14px;">Hello,</p>
    <p style="font-size:15px;line-height:1.65;color:#3d2e2e;margin:0 0 14px;">Thank you for your order. We are carefully printing your <strong style="color:#6B1F2A;font-weight:600;">${escapeHtml(d.format)} postcard</strong> and preparing it for the journey to <strong style="color:#6B1F2A;font-weight:600;">${escapeHtml(d.recipientName)}</strong> in <em style="color:#6B1F2A;font-style:italic;font-weight:500;">${escapeHtml(d.recipientCity)}, ${escapeHtml(d.recipientCountry)}</em>.</p>

    <!-- Order card — stacks on mobile -->
    <div class="pyc-order-card" style="margin:20px 0 18px;padding:18px 22px;background:#ffffff;border:1px solid #E0D4B6;border-radius:6px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td class="pyc-col" style="vertical-align:top;padding:0;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:10.5px;text-transform:uppercase;letter-spacing:0.22em;color:#B8943E;font-weight:600;margin-bottom:5px;line-height:1;">Order reference</div>
            <div class="pyc-ref-val" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;color:#2a1f1f;font-weight:500;line-height:1;word-break:break-all;">${escapeHtml(d.orderReference)}</div>
          </td>
          <td class="pyc-col pyc-col-right" style="vertical-align:top;padding:0;text-align:right;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:10.5px;text-transform:uppercase;letter-spacing:0.22em;color:#B8943E;font-weight:600;margin-bottom:5px;line-height:1;">Total paid</div>
            <div class="pyc-paid-val" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#6B1F2A;font-weight:700;line-height:1;">${d.totalPaid}</div>
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size:14px;line-height:1.6;color:#3d2e2e;margin:4px 0 16px;">Your postcard will travel by post and typically arrives within <strong style="color:#6B1F2A;font-weight:600;">5–10 business days</strong>.</p>

    <p class="pyc-quote" style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:17px;color:#6b5757;line-height:1.5;margin:6px 0 4px;">A small piece of your trip, on its way to someone who will love receiving it.</p>
  </div>

  <!-- Footer -->
  <div class="pyc-footer" style="border-top:1px solid #E0D4B6;padding:18px 28px 22px;text-align:center;background:#FAF6EE;">
    <div style="font-size:13px;color:#6b5757;margin:0 0 4px;">Questions? Just reply to this email.</div>
    <a href="mailto:info@postyourcard.com" style="color:#6B1F2A;text-decoration:none;font-weight:500;display:block;margin-top:4px;">info@postyourcard.com</a>
  </div>

  <!-- Bottom burgundy strip -->
  <div style="background:#6B1F2A;height:28px;border-top:2px solid #C9A961;"></div>

</div>
</body>
</html>`;
}
