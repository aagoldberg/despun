import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://despun.news"
  ),
  title: "Despun | News Without the Spin",
  description:
    "We synthesize today's top stories from across the political spectrum to extract core facts and reveal framing differences. What actually happened, minus the spin.",
  keywords: [
    "news",
    "unbiased news",
    "media bias",
    "balanced news",
    "political analysis",
    "news aggregator",
  ],
  authors: [{ name: "Despun" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://despun.news",
    siteName: "Despun",
    title: "Despun | News Without the Spin",
    description:
      "We synthesize today's top stories from across the political spectrum to extract core facts and reveal framing differences.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Despun - News Without the Spin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Despun | News Without the Spin",
    description:
      "We synthesize today's top stories from across the political spectrum to extract core facts and reveal framing differences.",
    images: ["/og-image.svg"],
    creator: "@despunnews",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
