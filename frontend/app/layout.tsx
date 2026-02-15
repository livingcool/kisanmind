// app/layout.tsx - Root layout for Next.js app
// KisanMind - AI-Powered Agricultural Intelligence System

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { SpotlightNavbar } from '@/components/ui/animated/SpotlightNavbar';
import { PollenBackground } from '@/components/ui/animated/PollenBackground';
// Temporarily disabled for demo - i18n needs client-side setup
// import '@/i18n.config';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'KisanMind - AI-Powered Agricultural Intelligence',
  description:
    'Get personalized crop recommendations based on soil, water, climate, and market conditions. Powered by Claude Opus 4.6.',
  keywords:
    'agriculture, farming, AI, crop recommendation, India, farmers, KisanMind',
  authors: [{ name: 'KisanMind Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#22c55e',
  openGraph: {
    title: 'KisanMind - Smart Farming Decisions',
    description:
      'AI-powered agricultural intelligence for Indian farmers. Get crop recommendations and maximize profits.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* PWA support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KisanMind" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-neutral-950`}>
        {/* Top Navigation */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <SpotlightNavbar />
        </div>

        {/* Main Content */}
        {children}

        {/* Global Background */}
        <PollenBackground />

      </body>
    </html>
  );
}
