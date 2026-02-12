// app/page.tsx - Enhanced Home page with beautiful UI

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import { ArrowRight, Sprout, CloudRain, TrendingUp, FileText, Sparkles, CheckCircle } from 'lucide-react';
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
          <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
            <Sprout className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
            {t('common.appName')}
          </h1>
        </div>
        <LanguageSelector />
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          {/* Main Heading with animation */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full mb-6 shadow-md">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Powered by Claude Opus 4.6</span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              {t('home.title')}
            </h2>

            <p className="text-xl md:text-2xl text-primary-700 font-semibold mb-4">
              {t('common.tagline')}
            </p>

            <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-3xl mx-auto">
              {t('home.subtitle')}
            </p>

            {/* CTA Button with enhanced styling */}
            <button
              onClick={() => {
                console.log('Button clicked, navigating to /input');
                router.push('/input');
              }}
              type="button"
              className="group min-h-touch px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xl font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center gap-3 mx-auto cursor-pointer"
            >
              {t('home.cta')}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4 mb-16 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 text-center transform hover:scale-105 transition-transform">
              <p className="text-3xl sm:text-4xl font-bold text-primary-600 mb-1">5</p>
              <p className="text-sm sm:text-base text-gray-600 font-medium">AI Agents</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 text-center transform hover:scale-105 transition-transform">
              <p className="text-3xl sm:text-4xl font-bold text-primary-600 mb-1">~30s</p>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Analysis Time</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 text-center transform hover:scale-105 transition-transform">
              <p className="text-3xl sm:text-4xl font-bold text-primary-600 mb-1">100%</p>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Free</p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
              {t('home.howItWorks')}
            </h3>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-green-200 transform transition-all hover:scale-105 hover:shadow-2xl">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {t('home.step1')}
                </h4>
                <p className="text-gray-600 text-center leading-relaxed">{t('home.step1Desc')}</p>
              </div>

              {/* Step 2 */}
              <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-blue-200 transform transition-all hover:scale-105 hover:shadow-2xl">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <CloudRain className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {t('home.step2')}
                </h4>
                <p className="text-gray-600 text-center leading-relaxed">{t('home.step2Desc')}</p>
              </div>

              {/* Step 3 */}
              <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-purple-200 transform transition-all hover:scale-105 hover:shadow-2xl">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {t('home.step3')}
                </h4>
                <p className="text-gray-600 text-center leading-relaxed">{t('home.step3Desc')}</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
              What You'll Get
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
              <div className="bg-white/90 backdrop-blur rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Soil Analysis</h4>
                    <p className="text-gray-600 text-sm">
                      Analyze soil type, pH, and nutrient content for optimal crop selection
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-water-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Water Assessment</h4>
                    <p className="text-gray-600 text-sm">
                      Evaluate water quality, availability, and irrigation requirements
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Climate Forecast</h4>
                    <p className="text-gray-600 text-sm">
                      Get rainfall predictions and temperature trends for your region
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Market Intelligence</h4>
                    <p className="text-gray-600 text-sm">
                      Track crop prices and find the best mandis to sell your produce
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Government Schemes</h4>
                    <p className="text-gray-600 text-sm">
                      Discover subsidies and support programs you qualify for
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Action Plan</h4>
                    <p className="text-gray-600 text-sm">
                      Month-by-month guidance from sowing to selling
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 sm:p-12 shadow-2xl">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Maximize Your Farm Profits?
            </h3>
            <p className="text-lg text-primary-100 mb-6">
              Get started with your free personalized farming plan today
            </p>
            <button
              onClick={() => {
                console.log('Bottom CTA clicked');
                router.push('/input');
              }}
              type="button"
              className="min-h-touch px-10 py-4 bg-white text-primary-700 text-lg font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-3 cursor-pointer"
            >
              Start Now - It's Free
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p className="mb-2 font-medium">Powered by Claude Opus 4.6 with Extended Thinking</p>
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
