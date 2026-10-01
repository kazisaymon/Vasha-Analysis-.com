import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hind_Siliguri } from "next/font/google";
import "./globals.css";

const body = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Bhasha · ভাষা",
  description: "Chat, translate and analyse files in Chittagonian, Bengali, English, Hindi, Chinese and more.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
