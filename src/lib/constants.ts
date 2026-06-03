import { PostcardFormat } from "@/store/order";

/** Centralized pricing — change here and it updates everywhere */
export const PRICE_CENTS = 799;
export const COMMISSION_CENTS = 160;
export const PRICE_DISPLAY = "€7,99";
export const PRICE_VALUE = 7.99;

export interface FormatInfo {
  key: PostcardFormat;
  family: "standard" | "large";
  orientation: "horizontal" | "vertical";
  name: string;
  dimensions: string;
  price: string;
  priceValue: number;
  aspectRatio: number;
  description: string;
  containerMaxWidth: string;
}

export const FORMATS: Record<PostcardFormat, FormatInfo> = {
  standard: {
    key: "standard",
    family: "standard",
    orientation: "horizontal",
    name: "Standard",
    dimensions: "148 × 105 mm",
    price: PRICE_DISPLAY,
    priceValue: PRICE_VALUE,
    aspectRatio: 148 / 105, // 1.41 — landscape
    description: "Classic postcard format — perfect for a personal greeting.",
    containerMaxWidth: "440px",
  },
  "standard-v": {
    key: "standard-v",
    family: "standard",
    orientation: "vertical",
    name: "Standard Vertical",
    dimensions: "105 × 148 mm",
    price: PRICE_DISPLAY,
    priceValue: PRICE_VALUE,
    aspectRatio: 105 / 148, // 0.709 — portrait
    description: "Classic postcard format — ideal for portrait photos.",
    containerMaxWidth: "320px",
  },
  large: {
    key: "large",
    family: "large",
    orientation: "horizontal",
    name: "Panoramic",
    dimensions: "210 × 99 mm",
    price: PRICE_DISPLAY,
    priceValue: PRICE_VALUE,
    aspectRatio: 210 / 99, // 2.12 — landscape
    description: "Panoramic format — ideal for landscape photos.",
    containerMaxWidth: "600px",
  },
  "large-v": {
    key: "large-v",
    family: "large",
    orientation: "vertical",
    name: "Panoramic Vertical",
    dimensions: "99 × 210 mm",
    price: PRICE_DISPLAY,
    priceValue: PRICE_VALUE,
    aspectRatio: 99 / 210, // 0.471 — portrait
    description: "Panoramic format — ideal for tall portrait photos.",
    containerMaxWidth: "280px",
  },
};
