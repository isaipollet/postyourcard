"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import Spinner from "@/components/ui/Spinner";
import CameraCapture from "@/components/CameraCapture";
import { useOrderStore } from "@/store/order";
import { FORMATS } from "@/lib/constants";
import { hapticTap } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MAX_FILE_SIZE = 20_000_000;
const MIN_PIXELS = 1200;

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.hotelSlug as string;

  const {
    selectedFormat,
    croppedImageUrl,
    setCloudinaryPublicId,
    setCroppedImageUrl,
  } = useOrderStore();
  const { t } = useLanguage();

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [cropConfirmed, setCropConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const format = selectedFormat ? FORMATS[selectedFormat] : FORMATS.standard;
  const aspectRatio = format.aspectRatio;

  // Redirect if no format selected
  useEffect(() => {
    if (!selectedFormat) {
      router.replace(`/order/${slug}`);
    }
  }, [selectedFormat, router, slug]);

  // Revoke blob URLs when no longer needed to avoid memory leaks
  useEffect(() => {
    return () => {
      if (uploadedUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedUrl);
      }
    };
  }, [uploadedUrl]);

  const initCrop = useCallback(() => {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    if (imgW < MIN_PIXELS || imgH < MIN_PIXELS) {
      setUploadError(
        t("upload.errorTooSmall", {
          w: String(imgW),
          h: String(imgH),
          min: String(MIN_PIXELS),
        })
      );
      setUploadedUrl(null);
      return;
    }

    let cropW: number, cropH: number;
    if (imgW / imgH > aspectRatio) {
      cropH = imgH;
      cropW = imgH * aspectRatio;
    } else {
      cropW = imgW;
      cropH = imgW / aspectRatio;
    }

    setCrop({
      x: (imgW - cropW) / 2,
      y: (imgH - cropH) / 2,
      width: cropW,
      height: cropH,
    });
  }, [aspectRatio, t]);

  const handleFile = (file: File) => {
    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(t("upload.errorTooLarge"));
      return;
    }

    if (uploadedUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(uploadedUrl);
    }

    // Remember where the user was scrolled before the page re-renders, so
    // we can restore it after the new crop UI mounts (otherwise the browser
    // tends to yank back to the top).
    const previousScrollY = window.scrollY;

    const blobUrl = URL.createObjectURL(file);
    setUploadedUrl(blobUrl);
    setCropConfirmed(false);
    setCrop(null);

    requestAnimationFrame(() => {
      window.scrollTo({ top: previousScrollY });
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (file) handleFile(file);
  };

  const handleCameraCapture = (file: File) => {
    setCameraOpen(false);
    handleFile(file);
  };

  const confirmCrop = async () => {
    if (!crop || !uploadedUrl || !imgRef.current || !selectedFormat) return;
    hapticTap();

    setUploading(true);
    setUploadError(null);

    try {
      const img = imgRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      // Convert canvas to blob and upload directly to Cloudinary
      // This avoids the 4.5MB Vercel body limit and CORS issues
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to create image blob"))),
          "image/jpeg",
          0.92
        );
      });

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary not configured");
      }

      const formData = new FormData();
      formData.append("file", blob, "postcard.jpg");
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "postyourcard");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Cloudinary upload failed:", res.status, errBody);
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setCloudinaryPublicId(data.public_id);
      setCroppedImageUrl(data.secure_url);
      setCropConfirmed(true);
    } catch (err) {
      console.error("Crop/upload failed:", err);
      setUploadError(t("upload.errorUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (!cropConfirmed) return;
    router.push(`/order/${slug}/message`);
  };

  // Crop drag — direct DOM updates during drag (avoid per-move React re-render),
  // commit to React state only on pointer up.
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startCropX: number;
    startCropY: number;
    el: HTMLElement;
    liveX: number;
    liveY: number;
  } | null>(null);

  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!crop) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCropX: crop.x,
      startCropY: crop.y,
      el,
      liveX: crop.x,
      liveY: crop.y,
    };
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !crop || !imgRef.current) return;
    const img = imgRef.current;
    const scale = img.naturalWidth / img.clientWidth;
    const dxImage = (e.clientX - drag.startX) * scale;
    const dyImage = (e.clientY - drag.startY) * scale;

    const newX = Math.max(0, Math.min(img.naturalWidth - crop.width, drag.startCropX + dxImage));
    const newY = Math.max(0, Math.min(img.naturalHeight - crop.height, drag.startCropY + dyImage));

    drag.liveX = newX;
    drag.liveY = newY;

    // Direct DOM update — bypass React re-render for smooth 60fps drag
    drag.el.style.left = `${(newX / img.naturalWidth) * 100}%`;
    drag.el.style.top = `${(newY / img.naturalHeight) * 100}%`;
  };

  const handleCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag && crop) {
      // Commit final position to React state
      setCrop({ ...crop, x: drag.liveX, y: drag.liveY });
    }
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  if (!selectedFormat) return null;

  return (
    <div className="page-fade-in">
      <ProgressBar currentStep={2} />

      {/* Hidden native file input for gallery */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Camera modal */}
      {cameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraOpen(false)}
          aspectRatio={aspectRatio}
        />
      )}

      {/* Bottom sheet — mobile only */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-[var(--background)] rounded-t-3xl p-5 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            {/* Drag handle */}
            <div className="w-12 h-1 bg-sand-300 rounded-full mx-auto mb-5" />
            <h3 className="font-heading text-xl font-medium text-gray-900 mb-1 text-center">
              {t("upload.title")}
            </h3>
            <p className="text-xs text-sand-500 text-center mb-5">
              {t(`upload.tip.${format.key}`)}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { hapticTap(); setSheetOpen(false); galleryInputRef.current?.click(); }}
                className="w-full flex items-center gap-3 py-4 px-5 rounded-2xl bg-teal text-white shadow-lg shadow-teal/20 active:scale-[0.98] transition-all"
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                </svg>
                <span className="font-semibold text-base">{t("upload.fromGallery")}</span>
              </button>
              <button
                onClick={() => { hapticTap(); setSheetOpen(false); setCameraOpen(true); }}
                className="w-full flex items-center gap-3 py-4 px-5 rounded-2xl bg-white border-2 border-teal text-teal shadow-md active:scale-[0.98] transition-all"
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <span className="font-semibold text-base">{t("upload.takePhoto")}</span>
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full py-3 text-center text-sm text-sand-600 font-medium"
              >
                {t("common.back")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center relative overflow-hidden">
        {/* Ambient background blobs */}
        <div className="absolute top-20 -right-32 w-[350px] h-[350px] rounded-full bg-[#6B1F2A]/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -left-32 w-[300px] h-[300px] rounded-full bg-[#C9963A]/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#6B1F2A]/[0.02] blur-3xl pointer-events-none" />

        {/* ── Header area with selected format reminder ── */}
        <div className="w-full bg-gradient-to-b from-[#6B1F2A]/[0.04] to-transparent pt-2 pb-6 px-4 relative z-10">
          <div className="max-w-sm mx-auto">
            <button
              onClick={() => router.push(`/order/${slug}`)}
              className="flex items-center gap-1.5 text-sm text-sand-600 font-medium
                px-3 py-1.5 rounded-full bg-white border border-sand-200 shadow-sm
                hover:border-teal/30 hover:text-teal hover:shadow-md active:scale-[0.97] transition-all mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t("common.back")}
            </button>

            <div className="flex items-center gap-3 mb-1">
              {/* Mini postcard shape showing selected format */}
              <div
                className="rounded-md overflow-hidden border border-sand-200 shadow-sm flex-shrink-0 bg-gradient-to-br from-teal/10 to-sand-100"
                style={{
                  width: format.key === "large" ? 48 : 32,
                  height: format.key === "large" ? 23 : 42,
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-teal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="font-heading text-xl font-medium text-gray-900">
                  {t("upload.title")}
                </h1>
                <p className="text-xs text-sand-500">
                  {t(`format.${format.key}.name`)} — {format.dimensions}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`w-full mx-auto px-4 pb-8 relative z-10 ${format.key === "large" ? "max-w-sm sm:max-w-[600px]" : "max-w-sm sm:max-w-[440px]"}`}>
          {uploadError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">
              {uploadError}
            </div>
          )}

          {!uploadedUrl ? (
            /* Empty state — Bruges background photo + two clear action buttons */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Postcard-shaped Bruges photo — sets the mood, no dashed placeholder */}
              <div
                className="w-full rounded-2xl overflow-hidden shadow-xl relative"
                style={{ aspectRatio: `${format.aspectRatio}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brugge-background.jpg"
                  alt="Bruges"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => { hapticTap(); galleryInputRef.current?.click(); }}
                  className="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl
                    bg-teal text-white shadow-xl shadow-teal/25
                    active:scale-[0.97] hover:bg-teal-600 transition-all min-h-[112px]"
                >
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <span className="font-semibold text-sm leading-tight text-center">{t("upload.fromGallery")}</span>
                </button>
                <button
                  onClick={() => { hapticTap(); setCameraOpen(true); }}
                  className="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl
                    bg-white border-2 border-teal text-teal shadow-md
                    active:scale-[0.97] hover:bg-teal/[0.04] transition-all min-h-[112px]"
                >
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="font-semibold text-sm leading-tight text-center">{t("upload.takePhoto")}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Photo uploaded — crop & preview ── */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Image with crop overlay */}
              <div
                ref={containerRef}
                className="relative overflow-hidden rounded-2xl border-2 border-sand-200 bg-gray-100 shadow-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={uploadedUrl}
                  alt="Uploaded photo"
                  className="w-full"
                  crossOrigin="anonymous"
                  onLoad={initCrop}
                />

                {crop && !cropConfirmed && (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                    <div
                      onPointerDown={handleCropPointerDown}
                      onPointerMove={handleCropPointerMove}
                      onPointerUp={handleCropPointerUp}
                      onPointerCancel={handleCropPointerUp}
                      className="absolute border-2 border-white/90 rounded-lg shadow-lg cursor-move touch-none select-none"
                      style={{
                        left: `${(crop.x / (imgRef.current?.naturalWidth || 1)) * 100}%`,
                        top: `${(crop.y / (imgRef.current?.naturalHeight || 1)) * 100}%`,
                        width: `${(crop.width / (imgRef.current?.naturalWidth || 1)) * 100}%`,
                        height: `${(crop.height / (imgRef.current?.naturalHeight || 1)) * 100}%`,
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
                      }}
                    >
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-teal rounded-full border-2 border-white pointer-events-none" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-teal rounded-full border-2 border-white pointer-events-none" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-teal rounded-full border-2 border-white pointer-events-none" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-teal rounded-full border-2 border-white pointer-events-none" />
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <div key={j} className="border border-white/30" />
                        ))}
                      </div>
                      {/* Crop label */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {t("upload.cropLabel", { name: t(`format.${format.key}.name`) })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Postcard preview after crop */}
              {cropConfirmed && croppedImageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6"
                >
                  <p className="text-[10px] font-bold text-teal/60 uppercase tracking-[0.15em] mb-3 text-center">
                    {t("upload.yourPostcard")}
                  </p>
                  {/* Postcard mockup with shadow */}
                  <motion.div
                    animate={{ rotate: [-1, 1, -1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto relative"
                    style={{ maxWidth: format.key === "large" ? "100%" : "80%" }}
                  >
                    <div className="rounded-2xl overflow-hidden border border-sand-200 shadow-2xl bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={croppedImageUrl} alt="Postcard preview" className="w-full" />
                    </div>
                    {/* Stamp */}
                    <div className="absolute top-2 right-2 w-6 h-7 border border-teal/25 rounded-[2px] bg-white/80 flex items-center justify-center shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal/40" />
                    </div>
                    {/* Shadow underneath */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[70%] h-3 bg-black/10 rounded-[50%] blur-sm" />
                  </motion.div>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setUploadedUrl(null);
                    setCropConfirmed(false);
                    setCrop(null);
                    setUploadError(null);
                  }}
                  disabled={uploading}
                  className="flex-1 py-3 rounded-2xl border border-sand-200 text-sand-600 text-sm font-medium
                    hover:border-sand-300 active:scale-[0.97] transition-all disabled:opacity-40 min-h-[48px] shadow-sm"
                >
                  {t("upload.changePhoto")}
                </button>
                {!cropConfirmed ? (
                  <button
                    onClick={confirmCrop}
                    disabled={!crop || uploading}
                    className="flex-1 py-3 rounded-2xl bg-teal text-white text-sm font-semibold
                      disabled:opacity-40 hover:bg-teal-600 active:scale-[0.97] transition-all
                      flex items-center justify-center gap-2 min-h-[48px] shadow-md shadow-teal/20"
                  >
                    {uploading ? <><Spinner className="w-4 h-4" /> {t("upload.processing")}</> : t("upload.confirmCrop")}
                  </button>
                ) : (
                  <button
                    onClick={() => { setCropConfirmed(false); setCrop(null); setUploadError(null); initCrop(); }}
                    className="flex-1 py-3 rounded-2xl border border-teal text-teal text-sm font-medium
                      hover:bg-teal/5 active:scale-[0.97] transition-all min-h-[48px]"
                  >
                    {t("upload.reCrop")}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Next CTA */}
          <div className="mt-8">
            <motion.button
              onClick={handleNext}
              disabled={!cropConfirmed}
              whileTap={cropConfirmed ? { scale: 0.97 } : undefined}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all
                flex items-center justify-center gap-2
                ${cropConfirmed
                  ? "bg-teal text-white shadow-xl shadow-teal/25"
                  : "bg-sand-200 text-sand-500 cursor-not-allowed"
                }`}
            >
              {cropConfirmed ? (
                <>
                  {t("upload.next")}
                  <motion.svg
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </motion.svg>
                </>
              ) : (
                t("upload.uploadFirst")
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
