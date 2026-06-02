import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Print-ready pixel dimensions at 300 dpi (mm / 25.4 * 300)
// standard:   148 × 105 mm → 1748 × 1240 px (landscape)
// standard-v: 105 × 148 mm → 1240 × 1748 px (portrait)
// large:      210 × 99 mm  → 2480 × 1169 px (landscape)
// large-v:    99 × 210 mm  → 1169 × 2480 px (portrait)
const PRINT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  standard:    { width: 1748, height: 1240 },
  "standard-v": { width: 1240, height: 1748 },
  large:       { width: 2480, height: 1169 },
  "large-v":   { width: 1169, height: 2480 },
};

/** Upload a base64 image to Cloudinary with print-ready transformation */
export async function uploadCroppedImage(
  base64Data: string,
  format: string,
  orderId: string
): Promise<{ publicId: string; secureUrl: string }> {
  const dims = PRINT_DIMENSIONS[format] ?? PRINT_DIMENSIONS["standard"];

  const result = await cloudinary.uploader.upload(base64Data, {
    folder: "postyourcard",
    public_id: `order-${orderId}`,
    transformation: [{ ...dims, crop: "fill", gravity: "center" }],
    resource_type: "image",
    format: "jpg",
    quality: 95,
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
}

/** Delete an image by public ID */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
