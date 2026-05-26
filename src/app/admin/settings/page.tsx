"use client";

import { PRICE_DISPLAY, COMMISSION_CENTS } from "@/lib/constants";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div>
        <h2 className="font-heading text-3xl font-medium text-gray-900">Settings</h2>
        <p className="text-base text-sand-600 mb-6">Manage your PostYourCard configuration</p>
      </div>

      <div className="space-y-4">
        {/* Stripe config */}
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <h3 className="font-heading font-semibold text-gray-800 mb-1">Stripe</h3>
          <p className="text-base text-sand-600 mb-3">Payment processing and hotel payouts</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-700 font-medium">Connected</span>
          </div>
        </div>

        {/* Fulfillment */}
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <h3 className="font-heading font-semibold text-gray-800 mb-1">Fulfillment</h3>
          <p className="text-base text-sand-600 mb-3">Self-fulfillment via email — orders are emailed to info@postyourcard.com for printing and shipping</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-700 font-medium">Manual</span>
          </div>
        </div>

        {/* Cloudinary config */}
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <h3 className="font-heading font-semibold text-gray-800 mb-1">Cloudinary</h3>
          <p className="text-base text-sand-600 mb-3">Image storage and processing</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-700 font-medium">Connected</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <h3 className="font-heading font-semibold text-gray-800 mb-1">Pricing</h3>
          <p className="text-base text-sand-600 mb-3">Postcard price and hotel commission</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">Price per card</p>
              <p className="font-heading font-medium text-gray-900">{PRICE_DISPLAY}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">Hotel commission</p>
              <p className="font-heading font-medium text-teal">&euro;{(COMMISSION_CENTS / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
