// app/about/page.tsx - About page

'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sprout, Droplet, CloudRain, TrendingUp, Gift, Cpu } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

export default function AboutPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const factors = [
    {
      icon: Sprout,
      key: 'soil',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Droplet,
      key: 'water',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: CloudRain,
      key: 'climate',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: TrendingUp,
      key: 'market',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Gift,
      key: 'schemes',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/')}
            className="min-h-touch flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                {t('common.appName')}
              </h1>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('about.title')}
            </h2>
            <p className="text-xl text-gray-600">{t('about.subtitle')}</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('about.howItWorks')}
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              {t('about.description')}
            </p>
          </div>

          {/* Factors Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {factors.map((factor) => {
              const Icon = factor.icon;
              return (
                <div
                  key={factor.key}
                  className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100 hover:border-primary-300 transition-all"
                >
                  <div
                    className={`w-14 h-14 ${factor.bgColor} rounded-full flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-8 h-8 ${factor.color}`} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {t(`about.factors.${factor.key}`)}
                  </h4>
                  <p className="text-gray-600">
                    {t(`about.factors.${factor.key}Desc`)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Technology Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-xl p-8 mb-12 border-2 border-purple-200">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('about.technology')}
                </h3>
                <p className="text-lg text-gray-700 mb-4">
                  {t('about.techDesc')}
                </p>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Architecture:</span> Multi-agent
                    orchestration with extended thinking
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Data Sources:</span> 15+ free
                    agricultural APIs
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Processing Time:</span> ~30 seconds
                    for complete analysis
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('about.contact')}
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Have questions or feedback? We&apos;d love to hear from you!
            </p>
            <a
              href="mailto:support@kisanmind.in"
              className="inline-block min-h-touch px-8 py-4 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('about.contactEmail')}
            </a>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={() => router.push('/input')}
              className="min-h-touch px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xl font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-2xl"
            >
              Get Your Farming Plan
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p className="text-sm">
            © 2026 KisanMind. Built for the Anthropic Claude Code Hackathon.
          </p>
          <p className="text-sm mt-2">
            Open source project powered by Claude Opus 4.6
          </p>
        </div>
      </footer>
    </div>
  );
}
