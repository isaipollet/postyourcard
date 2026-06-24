export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary-server";

export async function POST(request: Request) {
  let body: { dataUri: string; publicId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await cloudinary.uploader.upload(body.dataUri, {
      public_id: body.publicId,
      overwrite: true,
      resource_type: "image",
      format: "jpg",
      quality: 90,
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error("Asset upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
