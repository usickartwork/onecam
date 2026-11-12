import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAZZCAM — Camera App",
  description:
    "A lightweight, privacy-focused camera web app. Apply filters, adjust intensity, and save photos — all on your device.",
  keywords: ["camera", "filters", "photo", "privacy", "web camera"],
  authors: [{ name: "DAZZCAM" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
