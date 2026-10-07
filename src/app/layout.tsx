import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Bolt Hop — Leap. Loot. Deliver.",
  description:
    "Jump across sky platforms, collect coins, stomp drones, and reach the beacon. Fast mobile platformer. Play free in your browser.",
  keywords: ["platformer", "jump game", "browser game", "mobile game", "yandex games", "arcade"],
  authors: [{ name: "Bolt Hop" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "Bolt Hop — Leap. Loot. Deliver.",
    description: "How far can you hop? Collect coins and beat your best score.",
    type: "website",
    siteName: "Bolt Hop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolt Hop",
    description: "Leap. Loot. Deliver. Can you beat the score?",
  },
  robots: "index, follow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bolt Hop",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-white overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
