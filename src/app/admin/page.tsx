"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { hapticSuccess, hapticTap } from "@/lib/haptics";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  email: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  city: string | null;
  website: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  welcomeMessage: string | null;
  address: string | null;
  defaultLanguage: string | null;
  qrPlacement: string | null;
  tags: string | null;
  active: boolean;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  orderCount: number;
  commissionEarned: number;
}

export default function AdminPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHotel, setNewHotel] = useState({
    name: "", email: "", city: "", heroImageUrl: "", logoUrl: "",
    website: "", contactPerson: "", contactPhone: "", welcomeMessage: "",
    address: "", qrPlacement: "", tags: "",
  });
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const startEditing = (hotel: Hotel) => {
    setEditingId(hotel.id);
    setExpandedId(hotel.id);
    setEditData({
      name: hotel.name || "",
      email: hotel.email || "",
      city: hotel.city || "",
      website: hotel.website || "",
      contactPerson: hotel.contactPerson || "",
      contactPhone: hotel.contactPhone || "",
      welcomeMessage: hotel.welcomeMessage || "",
      address: hotel.address || "",
      heroImageUrl: hotel.heroImageUrl || "",
      logoUrl: hotel.logoUrl || "",
      qrPlacement: hotel.qrPlacement || "",
      tags: hotel.tags || "",
    });
  };

  const saveEditing = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hotels/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Failed");
      hapticSuccess();
      toast.success("Hotel updated");
      setEditingId(null);
      await fetchHotels();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const fetchHotels = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hotels");
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setHotels(data);
    } catch {
      toast.error("Failed to load hotels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const addHotel = async () => {
    if (!newHotel.name.trim() || !newHotel.email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHotel),
      });
      if (!res.ok) throw new Error("Failed to create hotel");
      setNewHotel({
        name: "", email: "", city: "", heroImageUrl: "", logoUrl: "",
        website: "", contactPerson: "", contactPhone: "", welcomeMessage: "",
        address: "", qrPlacement: "", tags: "",
      });
      setShowAddForm(false);
      hapticSuccess();
      toast.success("Hotel added successfully");
      await fetchHotels();
    } catch {
      toast.error("Failed to add hotel");
    } finally {
      setAdding(false);
    }
  };

  const downloadQR = async (slug: string) => {
    hapticTap();
    try {
      const res = await fetch(
        `/api/admin/hotels/qr?slug=${encodeURIComponent(slug)}`
      );
      if (!res.ok) throw new Error("Failed to generate QR");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${slug}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("QR code downloaded");
    } catch {
      toast.error("Failed to download QR code");
    }
  };

  const sendOnboardingLink = async (hotelId: string) => {
    hapticTap();
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}/onboarding`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate link");
      const data = await res.json();
      await navigator.clipboard.writeText(data.url);
      hapticSuccess();
      toast.success("Onboarding link copied to clipboard!");
    } catch {
      toast.error("Failed to generate onboarding link");
    }
  };

  const toggleActive = async (hotelId: string, currentActive: boolean) => {
    hapticTap();
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(currentActive ? "Hotel deactivated" : "Hotel activated");
      await fetchHotels();
    } catch {
      toast.error("Failed to update hotel status");
    }
  };

  const nh = newHotel;
  const setNh = (field: string, value: string) =>
    setNewHotel((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header + Add button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-3xl font-medium text-gray-900">
            Hotels
          </h2>
          <p className="text-base text-sand-600">{hotels.length} registered</p>
        </div>
        <button
          onClick={() => { hapticTap(); setShowAddForm(!showAddForm); }}
          className="px-4 py-2.5 rounded-xl bg-teal text-white text-base font-medium
            hover:bg-teal-600 active:scale-[0.97] transition-all flex items-center gap-1.5
            shadow-sm shadow-teal/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add hotel
        </button>
      </div>

      {/* Add hotel form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white rounded-2xl border-2 border-teal/20 p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-gray-800 mb-4">New hotel</h3>
              <div className="space-y-3">
                {/* Row 1: Name + City */}
                <div className="grid grid-cols-[2fr_1fr] gap-3">
                  <AdminInput label="Hotel name *" value={nh.name} onChange={(v) => setNh("name", v)} placeholder="Hotel Brugge" />
                  <AdminInput label="City" value={nh.city} onChange={(v) => setNh("city", v)} placeholder="Bruges" />
                </div>
                {/* Row 2: Email + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <AdminInput label="Email *" value={nh.email} onChange={(v) => setNh("email", v)} placeholder="contact@hotel.com" type="email" />
                  <AdminInput label="Phone" value={nh.contactPhone} onChange={(v) => setNh("contactPhone", v)} placeholder="+32 50 123 456" />
                </div>
                {/* Row 3: Contact person + Website */}
                <div className="grid grid-cols-2 gap-3">
                  <AdminInput label="Contact person" value={nh.contactPerson} onChange={(v) => setNh("contactPerson", v)} placeholder="Jan Jansen" />
                  <AdminInput label="Website" value={nh.website} onChange={(v) => setNh("website", v)} placeholder="https://hotel.com" type="url" />
                </div>
                {/* Address */}
                <AdminInput label="Address" value={nh.address} onChange={(v) => setNh("address", v)} placeholder="Markt 1, 8000 Brugge" />
                {/* Welcome message */}
                <div>
                  <label className="block text-xs font-medium text-sand-600 mb-1 uppercase tracking-wide">
                    Welcome message <span className="normal-case tracking-normal font-normal text-sand-400">(shown on landing page)</span>
                  </label>
                  <textarea
                    value={nh.welcomeMessage}
                    onChange={(e) => setNh("welcomeMessage", e.target.value)}
                    placeholder="Welcome to our boutique hotel in the heart of Bruges!"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-sand-200 text-base focus:outline-none focus:border-teal transition-colors resize-none"
                  />
                </div>
                {/* Hero image */}
                <div>
                  <label className="block text-xs font-medium text-sand-600 mb-1 uppercase tracking-wide">
                    Hero image URL <span className="normal-case tracking-normal font-normal text-sand-400">(background on landing page)</span>
                  </label>
                  <input
                    type="url"
                    value={nh.heroImageUrl}
                    onChange={(e) => setNh("heroImageUrl", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-sand-200 text-base focus:outline-none focus:border-teal transition-colors"
                  />
                  {nh.heroImageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-sand-200 h-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={nh.heroImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                {/* Row: Logo + QR placement + Tags */}
                <div className="grid grid-cols-3 gap-3">
                  <AdminInput label="Logo URL" value={nh.logoUrl} onChange={(v) => setNh("logoUrl", v)} placeholder="https://..." type="url" />
                  <AdminInput label="QR placement" value={nh.qrPlacement} onChange={(v) => setNh("qrPlacement", v)} placeholder="Lobby desk" />
                  <AdminInput label="Tags" value={nh.tags} onChange={(v) => setNh("tags", v)} placeholder="boutique, spa" />
                </div>
                {/* Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 rounded-xl border-2 border-sand-200 text-sand-700 text-base font-medium hover:border-sand-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addHotel}
                    disabled={adding || !nh.name.trim() || !nh.email.trim()}
                    className="px-5 py-2.5 rounded-xl bg-teal text-white text-base font-medium disabled:opacity-40 hover:bg-teal-600 transition-all flex items-center gap-2"
                  >
                    {adding && <Spinner className="w-3.5 h-3.5" />}
                    {adding ? "Adding..." : "Add hotel"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hotels list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-sand-200 p-5 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-36 bg-sand-200 rounded" />
                  <div className="h-3 w-24 bg-sand-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-sand-100 rounded-full" />
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-sand-100">
                <div className="h-3 w-16 bg-sand-100 rounded" />
                <div className="h-3 w-20 bg-sand-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : hotels.length === 0 ? (
        /* Rich empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-teal/[0.07] flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-teal/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-gray-800 text-lg mb-1">No hotels yet</h3>
          <p className="text-sand-600 text-base mb-5 max-w-xs">
            Add your first partner hotel to start generating QR codes and accepting orders.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 rounded-xl bg-teal text-white text-base font-medium
              hover:bg-teal-600 active:scale-[0.97] transition-all flex items-center gap-2
              shadow-sm shadow-teal/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add your first hotel
          </button>
        </div>
      ) : (
        <motion.div className="space-y-4" layout>
          <AnimatePresence mode="popLayout">
            {hotels.map((hotel) => (
              <motion.div
                key={hotel.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-sand-200 shadow-sm hover:shadow-md hover:border-sand-300 transition-all overflow-hidden"
              >
                {/* Hero image banner */}
                {hotel.heroImageUrl && (
                  <div className="h-24 w-full overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={hotel.heroImageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
                    {hotel.city && (
                      <span className="absolute bottom-2 left-3 text-xs font-bold text-gray-700 bg-white/80 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {hotel.city}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-5">
                {/* Top row: avatar + name + stripe status */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Hotel initial avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal/15 to-teal/5 flex items-center justify-center flex-shrink-0 border border-teal/10">
                    <span className="font-heading font-medium text-teal text-sm">
                      {hotel.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-medium text-xl text-gray-900 leading-tight truncate">
                      {hotel.name}
                    </h3>
                    <p className="text-base text-sand-600 mt-0.5 truncate">{hotel.slug}</p>
                  </div>
                  {hotel.stripeOnboarded ? (
                    <Badge variant="active" dot>Active</Badge>
                  ) : hotel.stripeAccountId ? (
                    <Badge variant="onboarding" dot>Pending</Badge>
                  ) : (
                    <Badge variant="none" dot>No Stripe</Badge>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-5 py-3 border-t border-sand-100">
                  <div>
                    <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">Orders</p>
                    <p className="font-heading font-medium text-gray-900 tabular-nums">{hotel.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">Commission</p>
                    <p className="font-heading font-medium text-teal tabular-nums">&euro;{hotel.commissionEarned.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-sand-600 uppercase tracking-wide">Email</p>
                    <p className="text-base text-sand-700 truncate">{hotel.email}</p>
                  </div>
                </div>

                {/* Expandable details / edit form */}
                {expandedId === hotel.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden py-3 border-t border-sand-100"
                  >
                    {editingId === hotel.id ? (
                      /* ── EDIT MODE ── */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <EditField label="Name" value={editData.name} onChange={(v) => setEditData({ ...editData, name: v })} />
                          <EditField label="Email" value={editData.email} onChange={(v) => setEditData({ ...editData, email: v })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <EditField label="City" value={editData.city} onChange={(v) => setEditData({ ...editData, city: v })} />
                          <EditField label="Website" value={editData.website} onChange={(v) => setEditData({ ...editData, website: v })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <EditField label="Contact person" value={editData.contactPerson} onChange={(v) => setEditData({ ...editData, contactPerson: v })} />
                          <EditField label="Phone" value={editData.contactPhone} onChange={(v) => setEditData({ ...editData, contactPhone: v })} />
                        </div>
                        <EditField label="Address" value={editData.address} onChange={(v) => setEditData({ ...editData, address: v })} />
                        <EditField label="Welcome message" value={editData.welcomeMessage} onChange={(v) => setEditData({ ...editData, welcomeMessage: v })} />
                        <EditField label="Hero image URL" value={editData.heroImageUrl} onChange={(v) => setEditData({ ...editData, heroImageUrl: v })} />
                        {editData.heroImageUrl && (
                          <div className="rounded-xl overflow-hidden border border-sand-200 h-20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={editData.heroImageUrl} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-3">
                          <EditField label="Logo URL" value={editData.logoUrl} onChange={(v) => setEditData({ ...editData, logoUrl: v })} />
                          <EditField label="QR placement" value={editData.qrPlacement} onChange={(v) => setEditData({ ...editData, qrPlacement: v })} />
                          <EditField label="Tags" value={editData.tags} onChange={(v) => setEditData({ ...editData, tags: v })} />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 rounded-xl border border-sand-200 text-sand-600 text-base font-medium hover:border-sand-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveEditing}
                            disabled={saving}
                            className="px-5 py-2 rounded-xl bg-teal text-white text-base font-medium disabled:opacity-40 hover:bg-teal-600 transition-all flex items-center gap-2"
                          >
                            {saving && <Spinner className="w-3.5 h-3.5" />}
                            {saving ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── VIEW MODE ── */
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <DetailField label="Contact" value={hotel.contactPerson} />
                        <DetailField label="Phone" value={hotel.contactPhone} />
                        <DetailField label="Website" value={hotel.website} link />
                        <DetailField label="Address" value={hotel.address} />
                        <DetailField label="City" value={hotel.city} />
                        <DetailField label="QR placement" value={hotel.qrPlacement} />
                        <div className="col-span-2">
                          <DetailField label="Welcome message" value={hotel.welcomeMessage} italic />
                        </div>
                        <DetailField label="Hero image" value={hotel.heroImageUrl ? "Set" : null} />
                        <DetailField label="Logo" value={hotel.logoUrl ? "Set" : null} />
                        {hotel.tags && (
                          <div className="col-span-2">
                            <p className="text-xs text-sand-600 uppercase tracking-wide mb-1">Tags</p>
                            <div className="flex gap-1 flex-wrap">
                              {hotel.tags.split(",").map((tag) => (
                                <span key={tag} className="px-2 py-0.5 bg-sand-100 rounded-full text-xs text-sand-700">{tag.trim()}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-sand-100">
                  <button
                    onClick={() => downloadQR(hotel.slug)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal/[0.07] text-teal text-xs font-medium
                      hover:bg-teal/15 active:scale-[0.97] transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                    </svg>
                    QR Code
                  </button>

                  {!hotel.stripeOnboarded && (
                    <button
                      onClick={() => sendOnboardingLink(hotel.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium
                        hover:bg-amber-100 active:scale-[0.97] transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                      Onboarding link
                    </button>
                  )}

                  {/* Edit button */}
                  <button
                    onClick={() => editingId === hotel.id ? setEditingId(null) : startEditing(hotel)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium active:scale-[0.97] transition-all ${
                      editingId === hotel.id
                        ? "bg-teal text-white"
                        : "bg-sand-50 text-sand-700 hover:bg-sand-100"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                    Edit
                  </button>

                  {/* Flyer generator */}
                  <a
                    href={`/admin/hotels/${hotel.id}/flyer`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sand-50 text-sand-700 text-xs font-medium
                      hover:bg-sand-100 active:scale-[0.97] transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Flyer
                  </a>

                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(hotel.id, hotel.active)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium active:scale-[0.97] transition-all ${
                      hotel.active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <div className={`w-7 h-4 rounded-full relative transition-colors ${hotel.active ? "bg-emerald-400" : "bg-slate-300"}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${hotel.active ? "left-3.5" : "left-0.5"}`} />
                    </div>
                    {hotel.active ? "Active" : "Inactive"}
                  </button>

                  {/* Expand/collapse */}
                  <button
                    onClick={() => setExpandedId(expandedId === hotel.id ? null : hotel.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-sand-50 text-sand-600 text-xs font-medium
                      hover:bg-sand-100 active:scale-[0.97] transition-all ml-auto"
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${expandedId === hotel.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    {expandedId === hotel.id ? "Less" : "Details"}
                  </button>
                </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function DetailField({ label, value, link, italic }: { label: string; value: string | null; link?: boolean; italic?: boolean }) {
  return (
    <div>
      <p className="text-xs text-sand-600 uppercase tracking-wide mb-0.5">{label}</p>
      {value ? (
        link ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline truncate block text-sm">{value.replace(/^https?:\/\//, "")}</a>
        ) : (
          <p className={`text-gray-800 text-base ${italic ? "italic" : ""}`}>{italic ? `"${value}"` : value}</p>
        )
      ) : (
        <p className="text-sand-500 text-base italic">Not set</p>
      )}
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-sand-600 mb-1 uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-sand-200 text-base focus:outline-none focus:border-teal transition-colors"
      />
    </div>
  );
}

function AdminInput({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-sand-600 mb-1 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border-2 border-sand-200 text-base focus:outline-none focus:border-teal transition-colors"
      />
    </div>
  );
}
