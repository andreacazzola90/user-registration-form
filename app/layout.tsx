import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passeggiata Monte di Malo | Iscrizioni",
  description:
    "Registrazione online con gestione admin, export e lista d'attesa",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
