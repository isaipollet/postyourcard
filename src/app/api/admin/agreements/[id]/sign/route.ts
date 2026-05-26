import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  agreements,
  agreementEvents,
  agreementSignatures,
  hotels,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { renderAgreementPdf, type AgreementPdfData } from "@/lib/agreements/pdf";
import { uploadSignedPdf, getClientIp, getUserAgent } from "@/lib/agreements/storage";
import { sendCompletionEmails } from "@/lib/agreements/email";

export const dynamic = "force-dynamic";

const SignSchema = z.object({
  signerName: z.string().min(2),
  signerEmail: z.string().email(),
  signerFunction: z.string().optional(),
  signatureDataUrl: z
    .string()
    .startsWith("data:image/")
    .min(100, "Signature is too small or empty"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = SignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const [agreement] = await db
    .select()
    .from(agreements)
    .where(eq(agreements.id, params.id))
    .limit(1);
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (agreement.status !== "signed_by_hotel") {
    return NextResponse.json(
      { error: `Hotel must sign first. Current status: ${agreement.status}` },
      { status: 400 }
    );
  }

  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.id, agreement.hotelId))
    .limit(1);
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const ip = getClientIp(req.headers);
  const userAgent = getUserAgent(req.headers);

  const [pycSignature] = await db
    .insert(agreementSignatures)
    .values({
      agreementId: agreement.id,
      party: "postyourcard",
      signerName: parsed.data.signerName,
      signerEmail: parsed.data.signerEmail,
      signerFunction: parsed.data.signerFunction || null,
      signatureDataUrl: parsed.data.signatureDataUrl,
      ip,
      userAgent,
    })
    .returning();

  await db
    .update(agreements)
    .set({ signedByPostyourcardAt: pycSignature.signedAt })
    .where(eq(agreements.id, agreement.id));

  await db.insert(agreementEvents).values({
    agreementId: agreement.id,
    type: "signed_postyourcard",
    ip,
    userAgent,
    metadata: { signer: parsed.data.signerName },
  });

  const allSignatures = await db
    .select()
    .from(agreementSignatures)
    .where(eq(agreementSignatures.agreementId, agreement.id));
  const events = await db
    .select()
    .from(agreementEvents)
    .where(eq(agreementEvents.agreementId, agreement.id))
    .orderBy(asc(agreementEvents.createdAt));

  const hotelSig = allSignatures.find((s) => s.party === "hotel");
  const pycSig = allSignatures.find((s) => s.party === "postyourcard");

  const variables = agreement.variables as Record<string, string>;

  const pdfData: AgreementPdfData = {
    contractNr: agreement.contractNr,
    ingangsdatum: variables.ingangsdatum,
    commissionPct: Number(variables.commission_pct || 15),
    hotel: {
      name: variables.hotel_name || hotel.name,
      address: variables.hotel_address || "",
      city: variables.hotel_city || "",
      email: variables.hotel_email || hotel.email,
      btw: variables.hotel_btw || "",
    },
    signatures: {
      hotel: hotelSig
        ? {
            name: hotelSig.signerName,
            email: hotelSig.signerEmail,
            fn: hotelSig.signerFunction,
            signedAt: hotelSig.signedAt,
            dataUrl: hotelSig.signatureDataUrl,
          }
        : undefined,
      postyourcard: pycSig
        ? {
            name: pycSig.signerName,
            email: pycSig.signerEmail,
            fn: pycSig.signerFunction,
            signedAt: pycSig.signedAt,
            dataUrl: pycSig.signatureDataUrl,
          }
        : undefined,
    },
    audit: events.map((e) => ({
      type: e.type,
      createdAt: e.createdAt,
      ip: e.ip,
      userAgent: e.userAgent,
      metadata: e.metadata,
    })),
  };

  const pdfBuffer = await renderAgreementPdf(pdfData);
  const { secureUrl } = await uploadSignedPdf(
    pdfBuffer,
    agreement.id,
    agreement.contractNr
  );

  const completedAt = new Date();
  await db
    .update(agreements)
    .set({
      signedPdfUrl: secureUrl,
      status: "completed",
      completedAt,
    })
    .where(eq(agreements.id, agreement.id));

  await db.insert(agreementEvents).values({
    agreementId: agreement.id,
    type: "completed",
    metadata: { pdfUrl: secureUrl },
  });

  const hotelEmail = variables.hotel_email || hotel.email;
  await sendCompletionEmails({
    hotelEmail,
    hotelName: hotel.name,
    contractNr: agreement.contractNr,
    pdfUrl: secureUrl,
  });

  return NextResponse.json({ ok: true, pdfUrl: secureUrl });
}
