import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Great Invasion — Hold the line. Claim the Well.",
  description:
    "Leap floating ruins in the Riftlands, cut through Dominion warbands, and stabilize Aether Wells. Fast tactical platformer. Play free in your browser.",
  keywords: [
    "platformer",
    "action game",
    "browser game",
    "mobile game",
    "riftlands",
    "the great invasion",
    "arcade",
  ],
  authors: [{ name: "The Great Invasion" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "The Great Invasion",
    description: "Hold the line. Claim the Well. Can you stabilize the Riftlands?",
    type: "website",
    siteName: "The Great Invasion",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Great Invasion",
    description: "Hold the line. Claim the Well.",
  },
  robots: "index, follow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Great Invasion",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050814",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#050814] text-white overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
