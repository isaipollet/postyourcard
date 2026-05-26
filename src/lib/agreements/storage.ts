import { cloudinary } from "../cloudinary-server";

export async function uploadSignedPdf(
  pdfBuffer: Buffer,
  agreementId: string,
  contractNr: string
): Promise<{ publicId: string; secureUrl: string }> {
  const dataUri = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "postyourcard/agreements",
    public_id: `${contractNr}-${agreementId}`,
    resource_type: "raw",
    format: "pdf",
    overwrite: true,
  });
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}

export function getUserAgent(headers: Headers): string {
  return headers.get("user-agent") || "unknown";
}
