import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PostcardFormat = "standard" | "standard-v" | "large" | "large-v";
export type MessageFont = "caveat" | "patrick-hand" | "dancing-script" | "kalam";

export interface Address {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

interface OrderState {
  selectedFormat: PostcardFormat | null;
  cloudinaryPublicId: string | null;
  croppedImageUrl: string | null;
  message: string;
  messageFont: MessageFont;
  customerEmail: string;
  address: Address;
  hotelLogoUrl: string | null;

  pendingOrderId: string | null;
  pendingClientSecret: string | null;
  pendingOrderReference: string | null;
  pendingFingerprint: string | null;

  setHotelLogoUrl: (url: string | null) => void;
  setFormat: (format: PostcardFormat) => void;
  setCloudinaryPublicId: (id: string) => void;
  setCroppedImageUrl: (url: string) => void;
  setMessage: (message: string) => void;
  setMessageFont: (font: MessageFont) => void;
  setCustomerEmail: (email: string) => void;
  setAddress: (address: Partial<Address>) => void;
  setPendingOrder: (data: {
    orderId: string;
    clientSecret: string;
    orderReference: string;
    fingerprint: string;
  }) => void;
  clearPendingOrder: () => void;
  reset: () => void;
}

const initialAddress: Address = {
  name: "",
  street: "",
  postalCode: "",
  city: "",
  country: "",
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      selectedFormat: null,
      cloudinaryPublicId: null,
      croppedImageUrl: null,
      message: "",
      messageFont: "caveat",
      customerEmail: "",
      address: { ...initialAddress },
      hotelLogoUrl: null,

      pendingOrderId: null,
      pendingClientSecret: null,
      pendingOrderReference: null,
      pendingFingerprint: null,

      setHotelLogoUrl: (url) => set({ hotelLogoUrl: url }),
      setFormat: (format) => set({ selectedFormat: format }),
      setCloudinaryPublicId: (id) => set({ cloudinaryPublicId: id }),
      setCroppedImageUrl: (url) => set({ croppedImageUrl: url }),
      setMessage: (message) => set({ message }),
      setMessageFont: (messageFont) => set({ messageFont }),
      setCustomerEmail: (email) => set({ customerEmail: email }),
      setAddress: (partial) =>
        set((state) => ({ address: { ...state.address, ...partial } })),
      setPendingOrder: ({ orderId, clientSecret, orderReference, fingerprint }) =>
        set({
          pendingOrderId: orderId,
          pendingClientSecret: clientSecret,
          pendingOrderReference: orderReference,
          pendingFingerprint: fingerprint,
        }),
      clearPendingOrder: () =>
        set({
          pendingOrderId: null,
          pendingClientSecret: null,
          pendingOrderReference: null,
          pendingFingerprint: null,
        }),
      reset: () =>
        set({
          selectedFormat: null,
          cloudinaryPublicId: null,
          croppedImageUrl: null,
          message: "",
          messageFont: "caveat",
          customerEmail: "",
          address: { ...initialAddress },
          hotelLogoUrl: null,
          pendingOrderId: null,
          pendingClientSecret: null,
          pendingOrderReference: null,
          pendingFingerprint: null,
        }),
    }),
    {
      name: "pyc-order",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
