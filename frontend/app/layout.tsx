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
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s?s==='dark':p)document.documentElement.setAttribute('data-theme','dark');})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
