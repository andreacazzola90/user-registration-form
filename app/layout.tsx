import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";
import { ThemeFloatingMenu } from "@/components/ThemeFloatingMenu";
import "./globals.css";

const sans = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700", "800"],
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Passeggiata Monte di Malo | Iscrizioni",
  description:
    "Registrazione online con gestione admin, export e lista d'attesa",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" data-theme="hillwalk">
      <body
        className={`${sans.variable} ${serif.variable} font-[var(--font-sans)] m-0`}
      >
        {children}
      </body>
    </html>
  );
}
