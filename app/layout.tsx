import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM · Pipeline de Oportunidades",
  description: "Tablero Kanban de oportunidades comerciales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
