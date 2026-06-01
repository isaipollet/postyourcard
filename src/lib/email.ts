import { Resend } from "resend";

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
  formatDimensions: string;
  hotelName: string;
  hotelEmail: string;
  hotelCity?: string | null;
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

    // 2. Fulfillment email to owner — contains everything needed to print + post
    resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `[PRINT] ${data.orderReference} — ${data.format} for ${data.recipientCity}, ${data.recipientCountry}`,
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

            <h3 style="margin: 0 0 8px; color: #6B1F2A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">✏️ Message (back)</h3>
            <div style="background: #FAF6EE; border: 1px solid #E0D4B6; padding: 14px; border-radius: 4px; font-style: italic; font-size: 15px; line-height: 1.5; white-space: pre-wrap; margin-bottom: 20px;">${escapeHtml(data.message)}</div>

            <h3 style="margin: 0 0 8px; color: #6B1F2A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">📬 Ship to</h3>
            <div style="background: white; border: 2px dashed #999; padding: 14px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>${escapeHtml(data.recipientName)}</strong><br />
              ${escapeHtml(data.recipientStreet)}<br />
              ${escapeHtml(data.recipientPostal)} ${escapeHtml(data.recipientCity)}<br />
              <strong style="text-transform: uppercase;">${escapeHtml(data.recipientCountry)}</strong>
            </div>

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
</head>
<body style="margin:0;padding:30px 16px;background:#e7e0d4;font-family:'Inter',-apple-system,sans-serif;">

<div style="max-width:580px;margin:0 auto;background:#FAF6EE;border-radius:4px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(107,31,42,0.25),0 0 0 1px rgba(0,0,0,0.04);">

  <!-- Burgundy banner -->
  <div style="background:#6B1F2A;padding:38px 28px 30px;text-align:center;">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;color:#C9A961;font-size:32px;font-weight:600;letter-spacing:0.32em;margin:0 0 12px;line-height:1;padding-left:0.32em;">POSTYOURCARD</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;color:rgba(255,255,255,0.88);font-size:15px;letter-spacing:0.04em;">
      <span style="color:#C9A961;font-style:normal;font-size:18px;margin-right:10px;">·</span>${tagline}<span style="color:#C9A961;font-style:normal;font-size:18px;margin-left:10px;">·</span>
    </div>
  </div>
  <div style="height:2px;background:#C9A961;"></div>

  <!-- Body -->
  <div style="padding:36px 36px 28px;color:#2a1f1f;">
    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;color:#6B1F2A;font-weight:600;margin:0 auto 8px;letter-spacing:-0.005em;line-height:1.15;text-align:center;">Your postcard is on its way</h1>
    <div style="width:56px;height:1px;background:#C9A961;margin:12px auto 26px;opacity:0.7;"></div>

    <p style="font-size:15.5px;line-height:1.65;color:#3d2e2e;margin:0 0 14px;">Hello,</p>
    <p style="font-size:15.5px;line-height:1.65;color:#3d2e2e;margin:0 0 14px;">Thank you for your order. We are carefully printing your <strong style="color:#6B1F2A;font-weight:600;">${escapeHtml(d.format)} postcard</strong> and preparing it for the journey to <strong style="color:#6B1F2A;font-weight:600;">${escapeHtml(d.recipientName)}</strong> in <em style="color:#6B1F2A;font-style:italic;font-weight:500;">${escapeHtml(d.recipientCity)}, ${escapeHtml(d.recipientCountry)}</em>.</p>

    <!-- Order card (2-column) -->
    <div style="margin:24px 0 22px;padding:20px 26px;background:#ffffff;border:1px solid #E0D4B6;border-radius:6px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:50%;vertical-align:top;padding:0;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:11.5px;text-transform:uppercase;letter-spacing:0.22em;color:#B8943E;font-weight:600;margin-bottom:6px;line-height:1;">Order reference</div>
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#2a1f1f;font-weight:500;line-height:1;">${escapeHtml(d.orderReference)}</div>
          </td>
          <td style="width:50%;vertical-align:top;padding:0;text-align:right;">
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:11.5px;text-transform:uppercase;letter-spacing:0.22em;color:#B8943E;font-weight:600;margin-bottom:6px;line-height:1;">Total paid</div>
            <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;color:#6B1F2A;font-weight:700;line-height:1;">${d.totalPaid}</div>
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size:14.5px;line-height:1.6;color:#3d2e2e;margin:6px 0 18px;">Your postcard will travel by post and typically arrives within <strong style="color:#6B1F2A;font-weight:600;">5–10 business days</strong>.</p>

    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:16pt;color:#6b5757;line-height:1.45;margin:8px 0 4px;">A small piece of your trip, on its way to someone who will love receiving it.</p>
  </div>

  <!-- Footer -->
  <div style="border-top:1px solid #E0D4B6;padding:22px 32px 24px;text-align:center;background:#FAF6EE;">
    <div style="font-size:13px;color:#6b5757;margin:0 0 4px;">Questions? Just reply to this email.</div>
    <a href="mailto:info@postyourcard.com" style="color:#6B1F2A;text-decoration:none;font-weight:500;display:block;margin-top:4px;">info@postyourcard.com</a>
  </div>

  <!-- Bottom burgundy strip -->
  <div style="background:#6B1F2A;height:32px;border-top:2px solid #C9A961;"></div>

</div>
</body>
</html>`;
}
