// app/input/page.tsx - Enhanced Farmer input page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import { ArrowLeft, Sprout, Sparkles } from 'lucide-react';
import FarmerInputForm from '@/components/FarmerInputForm';
import LanguageSelector from '@/components/LanguageSelector';
import { FarmerInput, submitFarmerInput } from '@/lib/api';

export default function InputPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: FarmerInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit to API
      const response = await submitFarmerInput(data);

      // Redirect to results page with session ID
      router.push(`/results/${response.sessionId}`);
    } catch (err) {
      console.error('Submission error:', err);
      setError(t('errors.serverError'));
      setIsSubmitting(false);

      // For demo purposes, use mock data
      console.log('Using mock data for demo...');
      setTimeout(() => {
        router.push('/results/demo-session');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/')}
            className="min-h-touch flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent hidden sm:block">
                {t('common.appName')}
              </h1>
            </div>
            <LanguageSelector />
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full mb-4 shadow-md">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">AI-Powered Analysis</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('input.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share details about your farm to get personalized, profit-optimized recommendations
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 border border-gray-200">
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-800 font-medium">{error}</p>
                <p className="text-red-600 text-sm mt-1">
                  Don't worry - we'll use demo data to show you how it works!
                </p>
              </div>
            )}

            <FarmerInputForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>

          {/* Information Cards */}
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 backdrop-blur rounded-xl p-6 border-2 border-green-200 text-center transform hover:scale-105 transition-all shadow-lg">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <span className="text-2xl">🤖</span>
              </div>
              <p className="text-2xl font-bold text-green-700 mb-1">5</p>
              <p className="text-sm text-gray-700 font-medium">AI Agents Analyzing</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur rounded-xl p-6 border-2 border-blue-200 text-center transform hover:scale-105 transition-all shadow-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 mb-1">~30s</p>
              <p className="text-sm text-gray-700 font-medium">Analysis Time</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 backdrop-blur rounded-xl p-6 border-2 border-purple-200 text-center transform hover:scale-105 transition-all shadow-lg">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <span className="text-2xl">💯</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 mb-1">100%</p>
              <p className="text-sm text-gray-700 font-medium">Free to Use</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 bg-white/80 backdrop-blur rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <span className="text-sm font-medium text-gray-700">No Hidden Costs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
