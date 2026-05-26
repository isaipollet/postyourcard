import { PostcardFormat, Address } from "@/store/order";

/** GET /api/hotels/[slug] */
export interface HotelResponse {
  name: string;
  logoUrl: string | null;
}

/** POST /api/orders — request body */
export interface CreateOrderRequest {
  hotelSlug: string;
  format: PostcardFormat;
  cloudinaryPublicId: string;
  croppedImageUrl: string;
  message: string;
  customerEmail: string;
  address: Address;
}

/** POST /api/orders — response */
export interface CreateOrderResponse {
  orderId: string;
  clientSecret: string;
  orderReference: string;
}

/** POST /api/upload — request body */
export interface UploadRequest {
  imageData: string;
  format: PostcardFormat;
}

/** POST /api/upload — response */
export interface UploadResponse {
  publicId: string;
  secureUrl: string;
}

/** GET /api/admin/hotels — single hotel in list */
export interface AdminHotel {
  id: string;
  name: string;
  slug: string;
  email: string;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  orderCount: number;
  commissionEarned: number;
}

/** POST /api/admin/hotels — request body */
export interface CreateHotelRequest {
  name: string;
  email: string;
  logoUrl?: string;
}

/** GET /api/admin/orders — single order */
export interface AdminOrder {
  id: string;
  orderReference: string;
  hotelName: string;
  format: string;
  status: string;
  commissionStatus: string;
  priceCents: number;
  commissionCents: number;
  recipientName: string;
  recipientCity: string;
  recipientCountry: string;
  customerEmail: string;
  emailsSent: boolean;
  createdAt: string;
}

/** POST /api/admin/hotels/[id]/onboarding — response */
export interface OnboardingResponse {
  url: string;
}
