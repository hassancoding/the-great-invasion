import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Great Invasion — Modern War Territory Game",
  description:
    "Expand your nation. Defend your borders. Conquer the map in this fast modern-war territory control game. Play free in your browser.",
  keywords: ["war game", "territory control", "strategy", "browser game", "modern war", "invasion"],
  authors: [{ name: "The Great Invasion" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "The Great Invasion",
    description: "Expand. Defend. Conquer the map. Can you hold more territory?",
    type: "website",
    siteName: "The Great Invasion",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Great Invasion",
    description: "Expand. Defend. Conquer the map. Can you hold more territory?",
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
