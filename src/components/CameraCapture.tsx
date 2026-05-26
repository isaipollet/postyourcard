"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
  aspectRatio?: number; // optional crop guide overlay (e.g. 1.4 for standard, 2.12 for panoramic)
}

export default function CameraCapture({ onCapture, onClose, aspectRatio }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch (err) {
        const e = err as DOMException;
        if (e.name === "NotAllowedError") {
          setError(t("camera.errorPermission"));
        } else if (e.name === "NotFoundError") {
          setError(t("camera.errorNoCamera"));
        } else {
          setError(t("camera.errorGeneric"));
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      style={{ height: "100dvh" }}
    >
      {/* Video — fills the whole screen */}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-white text-center px-6">
          <div className="max-w-sm">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold"
            >
              {t("common.back")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm bg-black/40">
              {t("camera.starting")}
            </div>
          )}

          {/* Crop framing guide — shows the postcard aspect ratio */}
          {ready && aspectRatio && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="relative"
                style={{
                  // Take 90% of the smaller dimension and fit aspect ratio
                  width: `min(90vw, ${aspectRatio * 70}vh)`,
                  aspectRatio: aspectRatio,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
                }}
              >
                {/* Frame border */}
                <div className="absolute inset-0 border-2 border-white/90 rounded-lg" />

                {/* Corner brackets for camera-app feel */}
                {[
                  "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
                  "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
                  "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
                  "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
                ].map((cls, i) => (
                  <div
                    key={i}
                    className={`absolute w-8 h-8 border-white ${cls}`}
                  />
                ))}

                {/* Rule-of-thirds grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <div key={j} className="border border-white/15" />
                  ))}
                </div>

                {/* Format label below the frame */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap font-medium tracking-wide">
                  {t("camera.frameHint")}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Top bar — close button, overlay */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <button
          onClick={onClose}
          className="text-white text-sm font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition"
          aria-label={t("camera.close")}
        >
          ✕ {t("camera.close")}
        </button>
        <span className="text-white/90 text-xs uppercase tracking-widest font-semibold drop-shadow">{t("camera.title")}</span>
        <div className="w-16" aria-hidden="true" />
      </div>

      {/* Bottom shutter — overlay, anchored above safe-area */}
      {!error && (
        <div
          className="absolute left-0 right-0 flex flex-col items-center gap-2 z-10 bg-gradient-to-t from-black/70 to-transparent pt-8"
          style={{
            bottom: 0,
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <button
            onClick={handleCapture}
            disabled={!ready}
            aria-label={t("camera.capture")}
            className="relative w-20 h-20 rounded-full bg-white shadow-2xl active:scale-95 transition-transform
              disabled:opacity-40 ring-4 ring-white/40 flex items-center justify-center"
          >
            <span className="absolute inset-2 rounded-full border-2 border-[#6B1F2A]" />
            <svg className="w-7 h-7 text-[#6B1F2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </button>
          <span className="text-white/90 text-xs uppercase tracking-widest font-medium drop-shadow">
            {t("camera.capture")}
          </span>
        </div>
      )}
    </div>
  );
}
