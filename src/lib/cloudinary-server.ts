import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Upload a base64 image to Cloudinary with print-ready transformation */
export async function uploadCroppedImage(
  base64Data: string,
  format: "standard" | "large",
  orderId: string
): Promise<{ publicId: string; secureUrl: string }> {
  const transformations =
    format === "standard"
      ? { width: 1240, height: 1748, crop: "fill", gravity: "center" }
      : { width: 1169, height: 2480, crop: "fill", gravity: "center" };

  const result = await cloudinary.uploader.upload(base64Data, {
    folder: "postyourcard",
    public_id: `order-${orderId}`,
    transformation: [transformations],
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
