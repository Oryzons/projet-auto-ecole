import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shift · Auto-école",
    template: "%s · Shift",
  },
  description: "Gestion de l'auto-école Shift : élèves, planning, paiements",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shift",
  },
};

export const viewport: Viewport = {
  themeColor: "#2d50f5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable)}
    >
      {/* des extensions du navigateur (ColorZilla, Grammarly…) ajoutent des attributs à <body> avant React */}
      <body className="min-h-svh" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
