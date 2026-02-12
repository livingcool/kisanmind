// app/input/page.tsx - Farmer input page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import { ArrowLeft, Sprout } from 'lucide-react';
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
            className="min-h-touch flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
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

        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('input.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share details about your farm to get personalized recommendations
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-800 font-medium">{error}</p>
              <p className="text-red-600 text-sm mt-1">
                Don't worry - we'll use demo data to show you how it works!
              </p>
            </div>
          )}

          <FarmerInputForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        {/* Information Cards */}
        <div className="mt-12 max-w-2xl mx-auto grid md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-2xl font-bold text-primary-600 mb-1">5</p>
            <p className="text-sm text-gray-600">AI Agents Analyzing</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-2xl font-bold text-primary-600 mb-1">~30s</p>
            <p className="text-sm text-gray-600">Analysis Time</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-2xl font-bold text-primary-600 mb-1">100%</p>
            <p className="text-sm text-gray-600">Free to Use</p>
          </div>
        </div>
      </main>
    </div>
  );
}
