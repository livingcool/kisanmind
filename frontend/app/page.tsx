// app/page.tsx - Home page

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import { ArrowRight, Sprout, CloudRain, TrendingUp, FileText } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

export default function HomePage() {
  const router = useRouter();
  const { t, ready } = useTranslation();

  useEffect(() => {
    // Initialize i18n
    if (!ready) return;
  }, [ready]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
            <Sprout className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('common.appName')}</h1>
        </div>
        <LanguageSelector />
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            {t('home.title')}
          </h2>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-primary-700 font-semibold mb-4">
            {t('common.tagline')}
          </p>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => router.push('/input')}
            className="min-h-touch px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xl font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center gap-3 mx-auto"
          >
            {t('home.cta')}
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* How It Works Section */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('home.howItWorks')}
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200 transform transition-transform hover:scale-105">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {t('home.step1')}
              </h4>
              <p className="text-gray-600 text-center">{t('home.step1Desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200 transform transition-transform hover:scale-105">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <CloudRain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {t('home.step2')}
              </h4>
              <p className="text-gray-600 text-center">{t('home.step2Desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200 transform transition-transform hover:scale-105">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {t('home.step3')}
              </h4>
              <p className="text-gray-600 text-center">{t('home.step3Desc')}</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur rounded-lg p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-2">Soil Analysis</h4>
            <p className="text-gray-600 text-sm">
              Analyze soil type, pH, and nutrient content for optimal crop selection
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-2">Water Assessment</h4>
            <p className="text-gray-600 text-sm">
              Evaluate water quality, availability, and irrigation requirements
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-2">Climate Forecast</h4>
            <p className="text-gray-600 text-sm">
              Get rainfall predictions and temperature trends for your region
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-2">Market Intelligence</h4>
            <p className="text-gray-600 text-sm">
              Track crop prices and find the best mandis to sell your produce
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p className="mb-2">Powered by Claude Opus 4.6</p>
          <p className="text-sm">
            <a
              href="/about"
              className="text-primary-600 hover:underline mr-4"
            >
              About
            </a>
            {' | '}
            <span className="ml-4">© 2026 KisanMind. All rights reserved.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
