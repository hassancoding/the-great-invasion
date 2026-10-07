import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Great Invasion — Tactical Battle Royale",
  description:
    "Operation Iron Gate. Survive the shrinking zone, command your squad, and eliminate hostiles in this fast 3D tactical battle royale. Play free in your browser.",
  keywords: ["battle royale", "tactical shooter", "war game", "browser game", "free fire style", "pubg browser", "3d game"],
  authors: [{ name: "The Great Invasion" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "The Great Invasion — Iron Gate",
    description: "Survive the zone. Command your squad. Can you beat the score?",
    type: "website",
    siteName: "The Great Invasion",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Great Invasion — Iron Gate",
    description: "Survive the zone. Command your squad. Can you beat the score?",
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
  themeColor: "#0a0e17",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0e17] text-white overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
