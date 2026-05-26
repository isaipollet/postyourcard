import { NextResponse } from "next/server";
import { uploadCroppedImage } from "@/lib/cloudinary-server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const UploadSchema = z.object({
  imageData: z.string().min(1),
  format: z.enum(["standard", "large"]),
});

export async function POST(request: Request) {
  // Rate limit: 20 uploads per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const { success } = rateLimit(`upload:${ip}`, {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const tempId = `temp-${crypto.randomUUID()}`;

  try {
    const result = await uploadCroppedImage(
      parsed.data.imageData,
      parsed.data.format,
      tempId
    );

    return NextResponse.json({
      publicId: result.publicId,
      secureUrl: result.secureUrl,
    });
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return NextResponse.json(
      { error: "Image upload failed" },
      { status: 500 }
    );
  }
}
