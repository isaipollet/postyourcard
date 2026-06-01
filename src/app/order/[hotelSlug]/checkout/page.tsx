"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import ProgressBar from "@/components/ProgressBar";
import { useOrderStore } from "@/store/order";
import { FORMATS } from "@/lib/constants";
import { getStripe } from "@/lib/stripe";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.hotelSlug as string;

  const { selectedFormat, croppedImageUrl, message, customerEmail, address } =
    useOrderStore();
  const { t, lang } = useLanguage();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [freeOrderId, setFreeOrderId] = useState<string | null>(null);
  const [freeConfirming, setFreeConfirming] = useState(false);

  useEffect(() => {
    if (!selectedFormat || !croppedImageUrl || !message.trim()) {
      router.replace(`/order/${slug}`);
      return;
    }

    const state = useOrderStore.getState();
    const fingerprint = JSON.stringify({
      slug,
      selectedFormat,
      cloudinaryPublicId: state.cloudinaryPublicId,
      croppedImageUrl,
      message,
      customerEmail,
      address,
    });

    if (
      state.pendingFingerprint === fingerprint &&
      state.pendingClientSecret &&
      state.pendingOrderReference
    ) {
      setClientSecret(state.pendingClientSecret);
      setOrderReference(state.pendingOrderReference);
      setCreating(false);
      return;
    }

    state.clearPendingOrder();

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelSlug: slug,
        format: selectedFormat,
        cloudinaryPublicId: state.cloudinaryPublicId,
        croppedImageUrl,
        message,
        customerEmail,
        address,
        promoCode: promoCode.trim() || undefined,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create order");
        return res.json();
      })
      .then((data) => {
        if (data.isFree) {
          // Promo code was valid — no Stripe needed
          setFreeOrderId(data.orderId);
          setOrderReference(data.orderReference);
          setPromoApplied(true);
        } else {
          setClientSecret(data.clientSecret);
          setOrderReference(data.orderReference);
          useOrderStore.getState().setPendingOrder({
            orderId: data.orderId,
            clientSecret: data.clientSecret,
            orderReference: data.orderReference,
            fingerprint,
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setCreating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!selectedFormat || !croppedImageUrl || !message.trim()) return null;

  const format = FORMATS[selectedFormat];

  if (creating) {
    return (
      <>
        <ProgressBar currentStep={4} />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sand-700 text-sm">{t("checkout.settingUp")}</p>
        </div>
      </>
    );
  }

  if (error || !clientSecret) {
    return (
      <>
        <ProgressBar currentStep={4} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 page-fade-in">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="font-heading font-semibold text-gray-800 mb-2">{t("checkout.errorTitle")}</p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 max-w-sm text-center mb-4">
            {error || t("checkout.errorDefault")}
          </div>
          <button
            onClick={() => router.back()}
            className="py-2.5 px-6 rounded-xl border-2 border-sand-300 text-sand-700 text-sm font-medium
              hover:border-teal hover:text-teal transition-colors min-h-[44px]"
          >
            {t("checkout.errorBack")}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="page-fade-in">
      <ProgressBar currentStep={4} />

      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <button
          onClick={() => router.push(`/order/${slug}/message`)}
          className="self-start flex items-center gap-1.5 text-sm text-sand-600 font-medium
            px-3 py-1.5 rounded-full bg-white border border-sand-200 shadow-sm
            hover:border-teal/30 hover:text-teal hover:shadow-md active:scale-[0.97] transition-all mt-2 mb-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("common.back")}
        </button>
        <h1 className="font-heading text-xl font-medium text-teal mt-2 mb-6">
          {t("checkout.title")}
        </h1>

        <div className="w-full max-w-sm space-y-6">
          {/* Order summary — receipt style */}
          <div className="bg-white rounded-2xl border-2 border-sand-200 p-4 overflow-hidden">
            <h2 className="font-heading font-semibold text-gray-800 mb-3">
              {t("checkout.summary")}
            </h2>

            {/* Larger postcard preview */}
            <div className="rounded-xl overflow-hidden border border-sand-200 mb-4 relative bg-sand-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={croppedImageUrl}
                alt="Your postcard"
                className="w-full"
              />
              {/* Faint stamp */}
              <div className="absolute top-2 right-2 w-7 h-9 border border-sand-400/30 rounded-sm bg-white/40 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full border border-sand-400/40" />
              </div>
            </div>

            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-gray-900">{t(`format.${format.key}.name`)}</p>
                <p className="text-sm text-sand-700">{format.dimensions}</p>
              </div>
              <span className="font-heading font-medium text-teal text-lg">
                {format.price}
              </span>
            </div>

            <p className="text-sm text-sand-600 mb-3">
              {t("checkout.deliverTo", { name: address.name, city: address.city })}
            </p>

            {/* Dotted receipt separator */}
            <div className="border-t-2 border-dotted border-sand-300 my-3" />

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-sm text-sand-600">
                <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t("checkout.shippingIncluded")}
              </span>
              <span className="font-heading font-medium text-gray-900 text-lg">
                {format.price}
              </span>
            </div>
          </div>

          {/* ── Promo code field ── */}
          {!promoApplied && (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo code"
                className="flex-1 px-4 py-3 rounded-2xl border border-sand-200 bg-white text-gray-900
                  placeholder:text-sand-400 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20
                  text-sm shadow-sm uppercase tracking-widest"
              />
            </div>
          )}

          {/* ── Free order confirm (promo code applied) ── */}
          {promoApplied && freeOrderId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-4">
              <div className="text-2xl">🎉</div>
              <p className="font-heading font-semibold text-emerald-800 text-lg">Promo code applied!</p>
              <p className="text-sm text-emerald-700">This order is free. Click below to confirm and send the emails.</p>
              <button
                onClick={async () => {
                  setFreeConfirming(true);
                  try {
                    await fetch(`/api/orders/${freeOrderId}/free-confirm`, { method: "POST" });
                    router.push(`/order/${slug}/confirmed?ref=${encodeURIComponent(orderReference!)}`);
                  } catch {
                    setFreeConfirming(false);
                  }
                }}
                disabled={freeConfirming}
                className="w-full py-3.5 px-6 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700
                  active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {freeConfirming ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                ) : (
                  <>✓ Confirm free test order</>
                )}
              </button>
            </div>
          )}

          {/* Stripe Elements — only when not a free promo order */}
          {!promoApplied && clientSecret && (
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret,
                locale: lang,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#6B1F2A",
                    borderRadius: "12px",
                    fontFamily: "Inter, system-ui, sans-serif",
                    colorBackground: "#FFFFFF",
                    colorText: "#1A1A1A",
                    colorTextPlaceholder: "#B5832E",
                  },
                  rules: {
                    ".Input": {
                      border: "2px solid #FAF0D7",
                      boxShadow: "none",
                    },
                    ".Input:focus": {
                      border: "2px solid #6B1F2A",
                      boxShadow: "none",
                    },
                  },
                },
              }}
            >
              <PaymentForm
                slug={slug}
                orderReference={orderReference!}
                price={format.price}
              />
            </Elements>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <TrustBadge icon="lock" text={t("checkout.trustSecure")} />
            <TrustBadge icon="clock" text={t("checkout.trustPrint")} />
            <TrustBadge icon="globe" text={t("checkout.trustWorldwide")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: "lock" | "clock" | "globe"; text: string }) {
  const paths: Record<string, string> = {
    lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    globe: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg className="w-4 h-4 text-teal/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={paths[icon]} />
      </svg>
      <span className="text-[10px] text-sand-600 text-center leading-tight">{text}</span>
    </div>
  );
}

function PaymentForm({
  slug,
  orderReference,
  price,
}: {
  slug: string;
  orderReference: string;
  price: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const baseUrl = window.location.origin;

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${baseUrl}/order/${slug}/confirmed?ref=${encodeURIComponent(orderReference)}`,
      },
    });

    // If we get here, there was an error (successful payments redirect)
    if (stripeError) {
      setError(stripeError.message || t("checkout.paymentFailed"));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-2xl border-2 border-sand-200 p-4">
        <h2 className="font-heading font-semibold text-gray-800 mb-3">
          {t("checkout.paymentDetails")}
        </h2>

        <PaymentElement />

        <div className="flex items-center gap-2 mt-3">
          <svg
            className="w-4 h-4 text-teal"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-xs text-sand-600">
            {t("checkout.poweredByStripe")}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mt-4 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-600 font-medium mt-1 text-xs hover:underline"
            >
              {t("common.tryAgain")}
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-6 py-3.5 px-6 rounded-xl font-medium text-white bg-teal transition-all min-h-[48px]
          disabled:opacity-70 disabled:cursor-not-allowed
          enabled:hover:bg-teal-600 enabled:active:scale-[0.98] enabled:shadow-lg enabled:shadow-teal/20
          flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {t("checkout.processing")}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t("checkout.pay", { price })}
          </>
        )}
      </button>
    </form>
  );
}
