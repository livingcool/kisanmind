"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import { ArrowLeft, Sprout, Sparkles } from 'lucide-react';
import FarmerInputForm from '@/components/FarmerInputForm';
import { FarmerInput, submitFarmerInput } from '@/lib/api';
import { motion } from 'framer-motion';

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
    <div className="flex h-screen w-full overflow-hidden bg-neutral-950 text-white">
      {/* 
        ------------------------------------------------------------
        LEFT SIDEBAR - FIXED
        ------------------------------------------------------------
      */}
      <aside className="hidden md:flex flex-col justify-between w-[40%] h-full p-8 lg:p-12 relative overflow-hidden bg-neutral-900/40 border-r border-white/5 backdrop-blur-xl">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group mb-8"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {t('common.appName')}
              </h1>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-6">
              <div className="w-4 h-4 relative flex items-center justify-center">
                <svg viewBox="0 -.01 39.5 39.53" className="w-full h-full">
                  <path d="m7.75 26.27 7.77-4.36.13-.38-.13-.21h-.38l-1.3-.08-4.44-.12-3.85-.16-3.73-.2-.94-.2-.88-1.16.09-.58.79-.53 1.13.1 2.5.17 3.75.26 2.72.16 4.03.42h.64l.09-.26-.22-.16-.17-.16-3.88-2.63-4.2-2.78-2.2-1.6-1.19-.81-.6-.76-.26-1.66 1.08-1.19 1.45.1.37.1 1.47 1.13 3.14 2.43 4.1 3.02.6.5.24-.17.03-.12-.27-.45-2.23-4.03-2.38-4.1-1.06-1.7-.28-1.02c-.1-.42-.17-.77-.17-1.2l1.23-1.67.68-.22 1.64.22.69.6 1.02 2.33 1.65 3.67 2.56 4.99.75 1.48.4 1.37.15.42h.26v-.24l.21-2.81.39-3.45.38-4.44.13-1.25.62-1.5 1.23-.81.96.46.79 1.13-.11.73-.47 3.05-.92 4.78-.6 3.2h.35l.4-.4 1.62-2.15 2.72-3.4 1.2-1.35 1.4-1.49.9-.71h1.7l1.25 1.86-.56 1.92-1.75 2.22-1.45 1.88-2.08 2.8-1.3 2.24.12.18.31-.03 4.7-1 2.54-.46 3.03-.52 1.37.64.15.65-.54 1.33-3.24.8-3.8.76-5.66 1.34-.07.05.08.1 2.55.24 1.09.06h2.67l4.97.37 1.3.86.78 1.05-.13.8-2 1.02-2.7-.64-6.3-1.5-2.16-.54h-.3v.18l1.8 1.76 3.3 2.98 4.13 3.84.21.95-.53.75-.56-.08-3.63-2.73-1.4-1.23-3.17-2.67h-.21v.28l.73 1.07 3.86 5.8.2 1.78-.28.58-1 .35-1.1-.2-2.26-3.17-2.33-3.57-1.88-3.2-.23.13-1.11 11.95-.52.61-1.2.46-1-.76-.53-1.23.53-2.43.64-3.17.52-2.52.47-3.13.28-1.04-.02-.07-.23.03-2.36 3.24-3.59 4.85-2.84 3.04-.68.27-1.18-.61.11-1.09.66-.97 3.93-5 2.37-3.1 1.53-1.79-.01-.26h-.09l-10.44 6.78-1.86.24-.8-.75.1-1.23.38-.4 3.14-2.16z" fill="#d97757" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-neutral-300">Powered by <strong>Opus 4.6</strong></span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {t('input.title')}
            </h2>
            <p className="text-lg text-neutral-400 max-w-md leading-relaxed">
              Share details about your farm to get personalized, profit-optimized recommendations.
            </p>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-1 gap-4 mt-auto">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-xl">🤖</div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">5</div>
                <div className="text-xs text-neutral-400 uppercase tracking-wider">AI Agents</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-xl">⚡</div>
              <div>
                <div className="text-2xl font-bold text-blue-400">~30s</div>
                <div className="text-xs text-neutral-400 uppercase tracking-wider">Analysis Time</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 
        ------------------------------------------------------------
        RIGHT CONTENT - SCROLLABLE
        ------------------------------------------------------------
      */}
      <main className="flex-1 h-full overflow-y-auto relative w-full">
        {/* Mobile Header (Visible only on small screens) */}
        <div className="md:hidden p-6 flex items-center justify-between bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
          <button onClick={() => router.push('/')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <span className="font-bold text-lg">{t('common.appName')}</span>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Form Container */}
        <div className="max-w-3xl mx-auto p-6 md:p-12 lg:p-16">
          <div className="mb-8 md:hidden">
            <h2 className="text-3xl font-bold text-white mb-2">{t('input.title')}</h2>
            <p className="text-neutral-400">Fill in the details below to get started.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-900/20 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-200 font-medium">{error}</p>
              <p className="text-red-300 text-sm mt-1">
                Don&apos;t worry - we&apos;ll use demo data to show you how it works!
              </p>
            </div>
          )}

          <div className="relative">
            {/* Form Background - very subtle */}
            <FarmerInputForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>

          {/* Mobile Stats/Trust (Visible only on small screens) */}
          <div className="mt-12 md:hidden grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-900/50 rounded-xl border border-white/5 text-center">
              <div className="text-2xl font-bold text-emerald-400">5 Agents</div>
              <div className="text-xs text-neutral-500">Working for you</div>
            </div>
            <div className="p-4 bg-neutral-900/50 rounded-xl border border-white/5 text-center">
              <div className="text-2xl font-bold text-blue-400">~30s</div>
              <div className="text-xs text-neutral-500">Analysis speed</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
