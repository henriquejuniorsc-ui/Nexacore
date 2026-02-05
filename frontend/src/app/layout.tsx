import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import "./globals.css";

/* ================================================================
   NEXACORE ROOT LAYOUT v4.0
   
   Optimizations:
   ─ Preconnect to Google Fonts + Vercel CDN (Geist Sans)
   ─ Enhanced Toaster with semantic icons and animations
   ─ Optimized viewport meta for mobile performance
   ─ Comprehensive SEO metadata
   ================================================================ */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B1215",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: {
    default: "NexaCore | Secretária Virtual com IA para Clínicas de Estética",
    template: "%s | NexaCore",
  },
  description:
    "Automatize o atendimento da sua clínica de estética com IA. Agendamentos, lembretes de procedimentos, cobrança automática e muito mais. Teste grátis por 14 dias.",
  keywords: [
    "secretária virtual",
    "IA para clínicas",
    "agendamento automático",
    "clínica de estética",
    "automação whatsapp",
    "chatbot clínica",
    "gestão de clínica",
    "software para estética",
  ],
  authors: [{ name: "NexaCore" }],
  creator: "NexaCore",
  publisher: "NexaCore",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://nexacore.com.br",
    siteName: "NexaCore",
    title: "NexaCore | Secretária Virtual com IA para Clínicas",
    description:
      "Automatize o atendimento da sua clínica de estética com IA. Agendamentos, lembretes e cobrança automática.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NexaCore - Secretária Virtual com IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexaCore | Secretária Virtual com IA",
    description: "Automatize sua clínica de estética com IA",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR} dynamic>
      <html lang="pt-BR" className="dark" suppressHydrationWarning>
        <head>
          {/* ─── Font Preconnects (performance critical) ─── */}
          {/* Google Fonts CDN — Inter, JetBrains Mono */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* Vercel CDN — Geist Sans */}
          <link rel="preconnect" href="https://assets.vercel.com" crossOrigin="anonymous" />

          {/* DNS prefetch for Clerk auth */}
          <link rel="dns-prefetch" href="https://clerk.nexacore.com.br" />
        </head>
        <body className="min-h-screen bg-background antialiased">
          {children}

          {/* ─── Enhanced Toast Notifications ─── */}
          <Toaster
            position="top-right"
            expand={false}
            richColors={false}
            gap={8}
            offset={16}
            duration={4000}
            closeButton
            toastOptions={{
              style: {
                background: "#161E2E",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#F1F5F9",
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontSize: "14px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                borderRadius: "12px",
                padding: "14px 16px",
              },
              className: "nexacore-toast",
            }}
            icons={{
              success: <CheckCircle className="w-[18px] h-[18px] text-success flex-shrink-0" />,
              error: <XCircle className="w-[18px] h-[18px] text-error flex-shrink-0" />,
              warning: <AlertTriangle className="w-[18px] h-[18px] text-warning flex-shrink-0" />,
              info: <Info className="w-[18px] h-[18px] text-trust flex-shrink-0" />,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}