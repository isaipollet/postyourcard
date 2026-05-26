import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  agreements,
  agreementEvents,
  agreementSignatures,
  hotels,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getClientIp, getUserAgent } from "@/lib/agreements/storage";
import { notifyAdminHotelSigned } from "@/lib/agreements/email";

export const dynamic = "force-dynamic";

const SignSchema = z.object({
  signerName: z.string().min(2),
  signerEmail: z.string().email(),
  signerFunction: z.string().optional(),
  signatureDataUrl: z
    .string()
    .startsWith("data:image/")
    .min(100, "Signature is too small or empty"),
  acceptedTerms: z.literal(true),
});

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const [agreement] = await db
    .select()
    .from(agreements)
    .where(eq(agreements.signToken, params.token))
    .limit(1);
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [hotel] = await db
    .select({ id: hotels.id, name: hotels.name, email: hotels.email })
    .from(hotels)
    .where(eq(hotels.id, agreement.hotelId))
    .limit(1);

  // Log first-time open as 'opened' event (only when status is 'sent')
  if (agreement.status === "sent") {
    const ip = getClientIp(req.headers);
    const userAgent = getUserAgent(req.headers);
    await db
      .update(agreements)
      .set({ status: "opened" })
      .where(eq(agreements.id, agreement.id));
    await db.insert(agreementEvents).values({
      agreementId: agreement.id,
      type: "opened",
      ip,
      userAgent,
    });
  }

  return NextResponse.json({
    agreement: {
      id: agreement.id,
      contractNr: agreement.contractNr,
      status: agreement.status,
      templateKey: agreement.templateKey,
      variables: agreement.variables,
      signedPdfUrl: agreement.signedPdfUrl,
    },
    hotel,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
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
    .where(eq(agreements.signToken, params.token))
    .limit(1);
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (agreement.status === "completed") {
    return NextResponse.json(
      { error: "Already completed" },
      { status: 400 }
    );
  }
  if (
    agreement.status !== "sent" &&
    agreement.status !== "opened"
  ) {
    return NextResponse.json(
      { error: `Cannot sign at status ${agreement.status}` },
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

  const [signature] = await db
    .insert(agreementSignatures)
    .values({
      agreementId: agreement.id,
      party: "hotel",
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
    .set({
      status: "signed_by_hotel",
      signedByHotelAt: signature.signedAt,
    })
    .where(eq(agreements.id, agreement.id));

  await db.insert(agreementEvents).values({
    agreementId: agreement.id,
    type: "signed_hotel",
    ip,
    userAgent,
    metadata: { signer: parsed.data.signerName },
  });

  // Notify admin to sign next
  const baseUrl = getBaseUrl(req);
  const adminUrl = `${baseUrl}/admin/agreements/${agreement.id}`;
  await notifyAdminHotelSigned({
    hotelName: hotel.name,
    contractNr: agreement.contractNr,
    adminUrl,
    signerName: parsed.data.signerName,
    signerEmail: parsed.data.signerEmail,
  }).catch((e) => console.error("notifyAdminHotelSigned failed:", e));

  return NextResponse.json({ ok: true });
}

function getBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
