/**
 * Print-batch pipeline: bundles all paid (not-yet-printed) orders into
 * print-ready PDFs (one per format, pages alternating front/back per card)
 * and emails them to the printer in a single message.
 *
 * Used by:
 *   - /api/cron/print-batch   (scheduled daily via Netlify function)
 *   - /api/admin/orders/print-batch (manual "Send to printer" button)
 *
 * Orders are marked status='printing' ONLY after the email is accepted by
 * Resend, so a failed run leaves them queued for the next attempt.
 */

import React from "react";
import { Document, Page, Image, pdf } from "@react-pdf/renderer";
import { Resend } from "resend";
import { inArray, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, hotels } from "@/lib/db/schema";
import { FORMATS } from "@/lib/constants";
import {
  generatePostcardBackUrl,
  generateFrontWithLogoUrl,
} from "@/lib/postcard-back-image";
import type { PostcardFormat } from "@/store/order";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

const FROM_EMAIL = "PostYourCard <info@postyourcard.com>";
const OWNER_EMAIL = "info@postyourcard.com";
/** Where batches go. Until PRINTER_EMAIL is configured, batches go to the owner. */
const PRINTER_EMAIL = process.env.PRINTER_EMAIL || OWNER_EMAIL;

/** Resend hard limit is 40 MB per message — stay well under it. */
const MAX_ATTACHMENT_BYTES = 35 * 1024 * 1024;

const MM_TO_PT = 72 / 25.4;

const FORMAT_MM: Record<PostcardFormat, { w: number; h: number }> = {
  standard: { w: 148, h: 105 },
  "standard-v": { w: 105, h: 148 },
  large: { w: 210, h: 99 },
  "large-v": { w: 99, h: 210 },
};

interface BatchOrder {
  id: string;
  orderReference: string | null;
  format: PostcardFormat;
  message: string | null;
  recipientName: string | null;
  recipientStreet: string | null;
  recipientPostal: string | null;
  recipientCity: string | null;
  recipientCountry: string | null;
  croppedImageUrl: string | null;
  hotelName: string;
  hotelLogoUrl: string | null;
}

export interface PrintBatchResult {
  batchRef: string;
  total: number;
  sent: number;
  skipped: { orderReference: string; reason: string }[];
  emails: number;
  recipient: string;
}

function safeRef(ref: string): string {
  return ref.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Predicted Cloudinary URL of the back PNG generated at order time. */
function predictedBackUrl(orderReference: string): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/postyourcard-backs/${safeRef(orderReference)}-back.png`;
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Resolve the print-ready front + back image buffers for one order.
 * The back normally already exists in Cloudinary (generated for the order
 * email); it is only regenerated when missing.
 */
async function resolveCardImages(
  order: BatchOrder
): Promise<{ front: Buffer; back: Buffer } | { error: string }> {
  if (!order.croppedImageUrl) return { error: "no photo" };
  if (!order.orderReference) return { error: "no order reference" };

  let frontUrl = order.croppedImageUrl;
  if (order.hotelLogoUrl) {
    try {
      frontUrl = await generateFrontWithLogoUrl(order.croppedImageUrl, order.hotelLogoUrl);
    } catch {
      frontUrl = order.croppedImageUrl; // print without logo rather than skip
    }
  }

  let back = await fetchBuffer(predictedBackUrl(order.orderReference));
  if (!back) {
    try {
      const backUrl = await generatePostcardBackUrl({
        orderReference: order.orderReference,
        message: order.message ?? "",
        recipientName: order.recipientName ?? "",
        recipientStreet: order.recipientStreet ?? "",
        recipientPostal: order.recipientPostal ?? "",
        recipientCity: order.recipientCity ?? "",
        recipientCountry: order.recipientCountry ?? "",
        formatKey: order.format,
        logoUrl: order.hotelLogoUrl,
      });
      back = await fetchBuffer(backUrl);
    } catch {
      back = null;
    }
  }
  if (!back) return { error: "back image unavailable" };

  const front = await fetchBuffer(frontUrl);
  if (!front) return { error: "front image unavailable" };

  return { front, back };
}

/** One PDF per format: for every card, page 1 = front photo, page 2 = back. */
async function buildFormatPdf(
  format: PostcardFormat,
  cards: { front: Buffer; back: Buffer }[]
): Promise<Buffer> {
  const { w, h } = FORMAT_MM[format];
  const size: [number, number] = [w * MM_TO_PT, h * MM_TO_PT];
  const full = { width: "100%" as const, height: "100%" as const };

  const doc = (
    <Document>
      {cards.map((card, i) => (
        <React.Fragment key={i}>
          <Page size={size} style={{ padding: 0 }}>
            <Image
              src={`data:image/jpeg;base64,${card.front.toString("base64")}`}
              style={full}
            />
          </Page>
          <Page size={size} style={{ padding: 0 }}>
            <Image
              src={`data:image/png;base64,${card.back.toString("base64")}`}
              style={full}
            />
          </Page>
        </React.Fragment>
      ))}
    </Document>
  );

  // Despite the name, toBuffer() returns a Node stream in react-pdf v4.
  const stream = await pdf(doc).toBuffer();
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

function batchEmailHtml(
  batchRef: string,
  groups: { format: PostcardFormat; refs: string[] }[],
  skipped: { orderReference: string; reason: string }[]
): string {
  const rows = groups
    .map(
      (g) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;"><strong>${FORMATS[g.format].name}</strong></td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${FORMATS[g.format].dimensions}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${g.refs.length}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px;">${g.refs.join(", ")}</td>
        </tr>`
    )
    .join("");

  const skippedHtml = skipped.length
    ? `<p style="color:#b91c1c;font-size:13px;">⚠️ Niet in deze batch (worden opnieuw geprobeerd): ${skipped
        .map((s) => `${s.orderReference} (${s.reason})`)
        .join(", ")}</p>`
    : "";

  return `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#6B1F2A;color:white;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:20px;">📮 PostYourCard — drukbatch ${batchRef}</h2>
        <p style="margin:6px 0 0;opacity:0.9;font-size:13px;">Elke PDF bevat per kaart 2 pagina's: voorzijde (foto) en achterzijde (bericht + adres), op exact drukformaat, 300 dpi.</p>
      </div>
      <div style="border:2px solid #6B1F2A;border-top:none;border-radius:0 0 8px 8px;padding:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#faf6ee;">
            <th style="padding:8px 12px;text-align:left;">Formaat</th>
            <th style="padding:8px 12px;text-align:left;">Afmeting</th>
            <th style="padding:8px 12px;">Aantal</th>
            <th style="padding:8px 12px;text-align:left;">Referenties</th>
          </tr>
          ${rows}
        </table>
        ${skippedHtml}
        <p style="font-size:13px;color:#666;margin-top:16px;">
          Vragen over deze batch? Antwoord gewoon op deze mail.<br/>
          PostYourCard · Brugge · info@postyourcard.com
        </p>
      </div>
    </div>`;
}

/**
 * Runs one print batch. Returns a summary; sends nothing when the queue is empty.
 */
export async function runPrintBatch(): Promise<PrintBatchResult> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const batchRef = `BATCH-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

  const queue = (await db
    .select({
      id: orders.id,
      orderReference: orders.orderReference,
      format: orders.format,
      message: orders.message,
      recipientName: orders.recipientName,
      recipientStreet: orders.recipientStreet,
      recipientPostal: orders.recipientPostal,
      recipientCity: orders.recipientCity,
      recipientCountry: orders.recipientCountry,
      croppedImageUrl: orders.croppedImageUrl,
      hotelName: hotels.name,
      hotelLogoUrl: hotels.logoUrl,
    })
    .from(orders)
    .innerJoin(hotels, eq(orders.hotelId, hotels.id))
    .where(sql`${orders.status} = 'paid'`)
    .orderBy(orders.createdAt)) as BatchOrder[];

  if (queue.length === 0) {
    return { batchRef, total: 0, sent: 0, skipped: [], emails: 0, recipient: PRINTER_EMAIL };
  }

  // Resolve images for all orders in parallel.
  const resolved = await Promise.all(
    queue.map(async (order) => ({ order, images: await resolveCardImages(order) }))
  );

  const skipped: { orderReference: string; reason: string }[] = [];
  const printable: { order: BatchOrder; front: Buffer; back: Buffer }[] = [];
  for (const r of resolved) {
    if ("error" in r.images) {
      skipped.push({
        orderReference: r.order.orderReference ?? r.order.id.slice(0, 8),
        reason: r.images.error,
      });
    } else {
      printable.push({ order: r.order, front: r.images.front, back: r.images.back });
    }
  }

  if (printable.length === 0) {
    return { batchRef, total: queue.length, sent: 0, skipped, emails: 0, recipient: PRINTER_EMAIL };
  }

  // Group by format and build one PDF per format.
  const byFormat = new Map<PostcardFormat, typeof printable>();
  for (const p of printable) {
    const list = byFormat.get(p.order.format) ?? [];
    list.push(p);
    byFormat.set(p.order.format, list);
  }

  const attachments: { filename: string; content: Buffer; format: PostcardFormat; refs: string[] }[] = [];
  for (const [format, cards] of Array.from(byFormat.entries())) {
    const pdfBuffer = await buildFormatPdf(
      format,
      cards.map((c: { front: Buffer; back: Buffer }) => ({ front: c.front, back: c.back }))
    );
    attachments.push({
      filename: `${batchRef}-${format}-${cards.length}x.pdf`,
      content: pdfBuffer,
      format,
      refs: cards.map(
        (c: { order: BatchOrder }) => c.order.orderReference ?? c.order.id.slice(0, 8)
      ),
    });
  }

  // Split into as many emails as needed to stay under the attachment limit.
  // (One attachment per format; a single format PDF over the limit is skipped
  // with a clear reason so those orders remain queued.)
  const emailGroups: (typeof attachments)[] = [];
  let current: typeof attachments = [];
  let currentBytes = 0;
  for (const att of attachments) {
    if (att.content.length > MAX_ATTACHMENT_BYTES) {
      for (const ref of att.refs) skipped.push({ orderReference: ref, reason: "PDF te groot voor e-mail" });
      continue;
    }
    if (currentBytes + att.content.length > MAX_ATTACHMENT_BYTES && current.length > 0) {
      emailGroups.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(att);
    currentBytes += att.content.length;
  }
  if (current.length > 0) emailGroups.push(current);

  const skippedRefs = new Set(skipped.map((s) => s.orderReference));
  let sentCount = 0;
  let emailsSent = 0;

  for (let i = 0; i < emailGroups.length; i++) {
    const group = emailGroups[i];
    const groupsMeta = group.map((g) => ({ format: g.format, refs: g.refs }));
    const totalCards = group.reduce((sum, g) => sum + g.refs.length, 0);
    const part = emailGroups.length > 1 ? ` (deel ${i + 1}/${emailGroups.length})` : "";

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: PRINTER_EMAIL,
      ...(PRINTER_EMAIL !== OWNER_EMAIL ? { cc: OWNER_EMAIL } : {}),
      subject: `[DRUKBATCH] ${batchRef}${part} — ${totalCards} postkaart${totalCards === 1 ? "" : "en"}`,
      attachments: group.map((g) => ({ filename: g.filename, content: g.content })),
      html: batchEmailHtml(batchRef, groupsMeta, i === emailGroups.length - 1 ? skipped : []),
    });

    if (error) {
      // Orders in this email stay 'paid' and will be retried next run.
      for (const g of group) {
        for (const ref of g.refs) skipped.push({ orderReference: ref, reason: "e-mail mislukt" });
        for (const ref of g.refs) skippedRefs.add(ref);
      }
      console.error(`[print-batch] Resend error for ${batchRef}:`, error);
      continue;
    }

    emailsSent++;
    sentCount += totalCards;
  }

  // Mark successfully emailed orders as 'printing'.
  const sentOrderIds = printable
    .filter((p) => !skippedRefs.has(p.order.orderReference ?? p.order.id.slice(0, 8)))
    .map((p) => p.order.id);

  if (sentOrderIds.length > 0) {
    await db
      .update(orders)
      .set({ status: "printing" })
      .where(inArray(orders.id, sentOrderIds));
  }

  return {
    batchRef,
    total: queue.length,
    sent: sentCount,
    skipped,
    emails: emailsSent,
    recipient: PRINTER_EMAIL,
  };
}
