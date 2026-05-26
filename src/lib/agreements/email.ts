import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

const FROM_EMAIL = "PostYourCard <info@postyourcard.com>";
const OWNER_EMAIL = "info@postyourcard.com";

const BURGUNDY = "#6B1F2A";
const CREAM = "#FAF6EE";

function shell(opts: { title: string; intro: string; ctaUrl?: string; ctaLabel?: string; details?: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; line-height: 1.5;">
      <div style="background: ${BURGUNDY}; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8;">PostYourCard</div>
        <div style="font-size: 20px; font-weight: 600; margin-top: 6px;">${opts.title}</div>
      </div>
      <div style="border: 1px solid #E5DDD0; border-top: none; border-radius: 0 0 8px 8px; padding: 24px; background: white;">
        <p style="margin: 0 0 16px;">${opts.intro}</p>
        ${
          opts.ctaUrl && opts.ctaLabel
            ? `<div style="margin: 24px 0;"><a href="${opts.ctaUrl}" style="display: inline-block; background: ${BURGUNDY}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">${opts.ctaLabel}</a></div>`
            : ""
        }
        ${
          opts.details
            ? `<div style="background: ${CREAM}; padding: 14px 16px; border-radius: 6px; font-size: 13px; color: #555; margin-top: 16px;">${opts.details}</div>`
            : ""
        }
        <hr style="border: none; border-top: 1px solid #E5DDD0; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; margin: 0;">PostYourCard · Echte postkaarten van je reis · postyourcard.com</p>
      </div>
    </div>
  `;
}

export async function sendSigningLink(opts: {
  hotelEmail: string;
  hotelName: string;
  contractNr: string;
  signUrl: string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: opts.hotelEmail,
    subject: `Samenwerkingsovereenkomst PostYourCard — klaar om te tekenen (${opts.contractNr})`,
    html: shell({
      title: "Samenwerkingsovereenkomst",
      intro: `Beste partner van <strong>${opts.hotelName}</strong>,<br /><br />Hierbij de samenwerkingsovereenkomst tussen PostYourCard en uw hotel. U kunt het document doorlezen en digitaal ondertekenen via de knop hieronder. Het tekenen duurt minder dan 2 minuten.`,
      ctaUrl: opts.signUrl,
      ctaLabel: "Bekijk en teken het contract",
      details: `Contract: <strong>${opts.contractNr}</strong><br />Na ondertekening ontvangen beide partijen automatisch een kopie. Vragen? Beantwoord deze e-mail.`,
    }),
  });
}

export async function notifyAdminHotelSigned(opts: {
  hotelName: string;
  contractNr: string;
  adminUrl: string;
  signerName: string;
  signerEmail: string;
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: OWNER_EMAIL,
    subject: `[ACTIE] ${opts.hotelName} heeft getekend — ${opts.contractNr}`,
    html: shell({
      title: `${opts.hotelName} heeft getekend`,
      intro: `<strong>${opts.signerName}</strong> (${opts.signerEmail}) heeft de overeenkomst zojuist digitaal ondertekend. Onderteken nu jullie kant in het admin-panel om het contract te voltooien.`,
      ctaUrl: opts.adminUrl,
      ctaLabel: "Open admin & onderteken",
      details: `Contract: <strong>${opts.contractNr}</strong>`,
    }),
  });
}

export async function sendCompletionEmails(opts: {
  hotelEmail: string;
  hotelName: string;
  contractNr: string;
  pdfUrl: string;
}) {
  const html = shell({
    title: "Overeenkomst voltooid",
    intro: `De samenwerkingsovereenkomst tussen PostYourCard en <strong>${opts.hotelName}</strong> is volledig ondertekend door beide partijen. De getekende PDF (inclusief audit trail) kan u downloaden via de knop hieronder.`,
    ctaUrl: opts.pdfUrl,
    ctaLabel: "Download getekend contract",
    details: `Contract: <strong>${opts.contractNr}</strong><br />Bewaar dit document zorgvuldig — het is uw juridisch bewijs van de overeenkomst.`,
  });

  return Promise.allSettled([
    resend.emails.send({
      from: FROM_EMAIL,
      to: opts.hotelEmail,
      subject: `Getekend: Samenwerkingsovereenkomst PostYourCard (${opts.contractNr})`,
      html,
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `[VOLTOOID] ${opts.hotelName} — ${opts.contractNr}`,
      html,
    }),
  ]);
}
