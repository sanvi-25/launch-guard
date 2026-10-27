import "./globals.css";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import type { Metadata, Viewport } from "next";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LaunchGuard | Aerospace & Spaceflight Slippage Intelligence",
  description: "Real-time orbital launch telemetry, delay early-warning signals, and supply chain slip risk analytics.",
  keywords: ["spaceflight", "launches", "delay risk", "aerospace", "SpaceX", "NASA", "rocket launches", "supply chain"],
  authors: [{ name: "LaunchGuard Intelligence Team" }],
};

export const viewport: Viewport = {
  themeColor: "#050814",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} dark scroll-smooth`}>
      <body className="font-sans antialiased bg-space-950 text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
