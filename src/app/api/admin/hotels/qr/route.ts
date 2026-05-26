import { NextResponse } from "next/server";
import QRCode from "qrcode";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://postyourcard.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const url = `${BASE_URL}/order/${slug}`;

  const buffer = await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    color: {
      dark: "#6B1F2A",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${slug}.png"`,
    },
  });
}
