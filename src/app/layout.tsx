import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Caveat, Patrick_Hand, Dancing_Script, Kalam } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwritten",
  weight: ["400", "500"],
  display: "swap",
});

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  variable: "--font-hand-print",
  weight: "400",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-hand-cursive",
  weight: ["400", "500"],
  display: "swap",
});

const kalam = Kalam({
  subsets: ["latin"],
  variable: "--font-hand-pen",
  weight: ["400"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6B1F2A",
};

export const metadata: Metadata = {
  title: "PostYourCard — Send a Real Postcard",
  description:
    "Upload a photo, write a message, and we'll print and mail a real postcard for you.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PostYourCard",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Force-unregister stale service workers in development */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  registrations.forEach(function(registration) {
                    registration.unregister();
                  });
                });
                caches.keys().then(function(names) {
                  names.forEach(function(name) { caches.delete(name); });
                });
              }
            `,
          }}
        />
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link
          rel="apple-touch-icon"
          sizes="512x512"
          href="/icons/icon-512x512.svg"
        />

        {/* Apple splash screens — generated from the teal brand color */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Prevent zoom on input focus (iOS) */}
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${caveat.variable} ${patrickHand.variable} ${dancingScript.variable} ${kalam.variable} font-body antialiased`}
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className: "font-body",
            style: {
              borderRadius: "12px",
              border: "2px solid #FAF0D7",
              background: "#FFFDF9",
            },
          }}
        />
      </body>
    </html>
  );
}
