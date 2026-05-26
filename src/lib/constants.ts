import { PostcardFormat } from "@/store/order";

/** Centralized pricing — change here and it updates everywhere */
export const PRICE_CENTS = 799;
export const COMMISSION_CENTS = 160;
export const PRICE_DISPLAY = "€7.99";
export const PRICE_VALUE = 7.99;

export interface FormatInfo {
  key: PostcardFormat;
  name: string;
  dimensions: string;
  price: string;
  priceValue: number;
  aspectRatio: number;
  description: string;
}

export const FORMATS: Record<PostcardFormat, FormatInfo> = {
  standard: {
    key: "standard",
    name: "Standard",
    dimensions: "105 × 148 mm",
    price: PRICE_DISPLAY,
    priceValue: PRICE_VALUE,
    aspectRatio: 148 / 105, // 1.4095 — landscape
    description: "Classic postcard format — perfect for a personal greeting.",
  },
  large: {
    key: "large",
    name: "Panoramic",
    dimensions: "99 × 210 mm",
    price: PRICE_DISPLAY,
    priceValue: PRICE_VALUE,
    aspectRatio: 210 / 99, // 2.1212 — landscape
    description: "Panoramic format — ideal for landscape photos.",
  },
};
