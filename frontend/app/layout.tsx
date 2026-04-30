import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatBot de Modelos de Simulacion",
  description: "Frontend inicial para el ChatBot de modelos de simulacion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
