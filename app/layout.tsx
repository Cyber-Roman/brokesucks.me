import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import localFont from 'next/font/local';
import "./globals.css";


const soriaFont = localFont({
  src: "../public/soria-font.ttf",
  variable: "--font-soria",
});


const vercettiFont = localFont({
  src: "../public/Vercetti-Regular.woff",
  variable: "--font-vercetti",
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com/'),
  title: "Roma Dulin — Flex Design & Forward-Thinking Creative",
  description:
    "Roma Dulin showcases cutting-edge flex design, bold visuals, and big boy energy. A creative focused on next-level web experiences and forward-thinking design.",
  keywords:
    "Roma Dulin, flex, flex design, big boy, creative developer, frontend developer, advanced design, cutting-edge design, web design, React, TypeScript, portfolio",
  authors: [{ name: "Roma Dulin" }],
  creator: "Roma Dulin",
  publisher: "Roma Dulin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Roma Dulin — Flex Design & Forward-Thinking Creative",
    description:
      "Roma Dulin showcases cutting-edge flex design, bold visuals, and big boy energy. A creative focused on next-level web experiences.",
    siteName: "Roma Dulin Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roma Dulin — Flex Design & Forward-Thinking Creative",
    description:
      "Roma Dulin showcases cutting-edge flex design, bold visuals, and big boy energy. A creative focused on next-level web experiences.",
  },
  verification: {
    // оставь свой, если это твой сайт, или удали/замени при необходимости
    
  },
};


export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overscroll-y-none">
      <body
        className={`${soriaFont.variable} ${vercettiFont.variable} font-sans antialiased`}
      >
        {children}
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
    </html>
  );
}