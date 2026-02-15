'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import {
  ArrowRight, Sprout, CloudRain, TrendingUp, FileText, Sparkles, CheckCircle,
  Home, Info, Calendar, DollarSign, Award, Leaf
} from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import LightLines from '@/components/ui/LightLines';
import LiquidText from '@/components/ui/LiquidText';
import FlipText from '@/components/ui/FlipText';
import SpotlightNavbar from '@/components/ui/SpotlightNavbar';
import GlassDock from '@/components/ui/GlassDock';

export default function HomePage() {
  const router = useRouter();
  const { t, ready } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Dashboard", href: "/input" },
    { label: "Market", href: "#market" },
    { label: "Schemes", href: "#schemes" },
  ];

  const dockItems = [
    { title: "Home", icon: Home, href: "/" },
    { title: "Start Analysis", icon: Sprout, onClick: () => router.push('/input') },
    { title: "Market Prices", icon: DollarSign, href: "#market" },
    { title: "Schemes", icon: Award, href: "#schemes" },
    { title: "About", icon: Info, href: "/about" },
  ];

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      {/* Animated Background */}
      <LightLines
        className="fixed inset-0 z-0"
        lineColor="rgba(34, 197, 94, 0.2)"
        lightColor="#4ADE80"
        gradientFrom="#022c22"
        gradientTo="#064e3b"
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <header className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-900/50">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">KisanMind</span>
          </div>

          <SpotlightNavbar items={navItems} className="hidden md:flex" />

          <div className="flex items-center gap-4">
            <LanguageSelector />
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col items-center justify-center container mx-auto px-4 py-12 text-center">

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="h-40 md:h-60 w-full flex items-center justify-center relative">
              <LiquidText
                text={t('common.appName') || "KisanMind"}
                fontSize={120}
                color="#4ADE80"
                font="Inter, sans-serif"
                className="w-full h-full"
              />
            </div>

            <div className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              <FlipText className="block text-center">{t('home.title') || "Empowering Farmers with AI"}</FlipText>
            </div>

            <p className="text-xl text-green-100/80 max-w-2xl mx-auto">
              {t('home.subtitle') || "Your personal AI agronomist for better yields and higher profits."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={() => router.push('/input')}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-green-900/50 flex items-center justify-center gap-2"
              >
                {t('home.cta') || "Get Started"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Features Grid Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-6xl mx-auto w-full">
            {[
              { icon: FileText, title: t('home.step1') || "Input Details", desc: t('home.step1Desc') || "Enter your location and crop details" },
              { icon: CloudRain, title: t('home.step2') || "AI Analysis", desc: t('home.step2Desc') || "We analyze soil, weather, and market data" },
              { icon: TrendingUp, title: t('home.step3') || "Get Report", desc: t('home.step3Desc') || "Receive a comprehensive farming plan" }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors text-left group">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-green-100/60">{item.desc}</p>
              </div>
            ))}
          </div>

        </main>

        {/* Dock for quick access */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <GlassDock items={dockItems} />
        </div>

        <footer className="container mx-auto px-4 py-8 text-center text-green-100/40 text-sm relative z-10 mb-20 md:mb-0">
          <p>© 2026 KisanMind. Powered by Claude Opus 4.6.</p>
        </footer>
      </div>
    </div>
  );
}
