// app/results/[sessionId]/page.tsx - Results page showing farming plan

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import { ArrowLeft, Sprout } from 'lucide-react';
import LoadingProgress from '@/components/LoadingProgress';
import FarmingReport from '@/components/FarmingReport';
import {
  getFarmingPlan,
  downloadFarmingPlanPDF,
  shareFarmingPlan,
  getMockFarmingPlan,
  FarmingPlan,
} from '@/lib/api';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const sessionId = params.sessionId as string;

  const [plan, setPlan] = useState<FarmingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Fetch farming plan
  const fetchPlan = useCallback(async () => {
    // Prevent multiple concurrent requests
    if (isFetchingRef.current || !mountedRef.current) {
      return;
    }

    try {
      if (sessionId === 'demo-session') {
        // Use mock data for demo
        setTimeout(() => {
          if (mountedRef.current) {
            setPlan(getMockFarmingPlan());
            setIsLoading(false);
          }
        }, 2000);
        return;
      }

      isFetchingRef.current = true;
      const data = await getFarmingPlan(sessionId);

      if (!mountedRef.current) return;

      setPlan(data);
      isFetchingRef.current = false;

      // If completed, stop loading and show results
      if (data.status === 'completed') {
        setIsLoading(false);
      } else if (data.status === 'processing') {
        // Still processing, poll again after 3 seconds
        setTimeout(() => fetchPlan(), 3000);
      } else {
        // Error state
        setIsLoading(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;

      console.error('Error fetching plan:', err);
      setError(t('errors.serverError'));
      isFetchingRef.current = false;

      // Fallback to mock data after a short delay
      setTimeout(() => {
        if (mountedRef.current) {
          setPlan(getMockFarmingPlan());
          setIsLoading(false);
        }
      }, 1000);
    }
  }, [sessionId, t]);

  useEffect(() => {
    mountedRef.current = true;
    fetchPlan();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchPlan]);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      const blob = await downloadFarmingPlanPDF(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farming-plan-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      // Fallback: print the page
      window.print();
    }
  };

  // Handle share
  const handleShare = () => {
    if (!plan?.synthesis) return;

    const shareText = `My Farming Plan from KisanMind:

Recommended Crop: ${plan.synthesis.recommendedCrop.name}
Expected Profit: ₹${plan.synthesis.recommendedCrop.profitEstimate.toLocaleString('en-IN')}
Sowing Date: ${plan.synthesis.sowingDetails.sowingDate}

Get your personalized farming plan at KisanMind!`;

    shareFarmingPlan(sessionId, shareText);
  };

  // Handle new plan
  const handleNewPlan = () => {
    router.push('/input');
  };

  return (
    <div className="min-h-screen pt-20 bg-neutral-950"> {/* Forcing dark background for white text */}
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Home</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-full flex items-center justify-center backdrop-blur-md">
                <Sprout className="w-5 h-5 text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">
                {t('common.appName')}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-6 bg-red-900/20 border border-red-500/30 backdrop-blur-md rounded-2xl">
            <p className="text-red-400 font-medium">{error}</p>
            <p className="text-red-300/70 text-sm mt-1">
              Showing demo data for reference
            </p>
          </div>
        )}

        {/* Loading State - Show while processing */}
        {plan && plan.status === 'processing' && (
          <div className="mb-12">
            <LoadingProgress
              agentStatuses={plan.agentStatuses || []}
              estimatedTime={30}
            />

            {/* Show synthesis message when all agents complete */}
            {plan.agentStatuses && plan.agentStatuses.every(a => a.status === 'completed') && (
              <div className="max-w-2xl mx-auto mt-6 p-6 bg-purple-900/20 border border-purple-500/30 backdrop-blur-md rounded-2xl animate-fadeIn">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center animate-pulse border border-purple-500/30">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Generating Your Farming Plan
                    </h3>
                    <p className="text-purple-300">
                      Claude Opus 4.6 is synthesizing insights with Extended Thinking...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Initial Loading (before plan data arrives) */}
        {isLoading && !plan && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-neutral-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-10">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse border border-emerald-500/20">
                <span className="text-4xl">🌾</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Preparing Your Analysis
              </h3>
              <p className="text-neutral-400 mb-6">
                Our AI agents are getting ready to analyze your farm...
              </p>
            </div>
          </div>
        )}

        {/* Completed Plan - Show when status is completed */}
        {plan && plan.status === 'completed' && plan.synthesis && (
          <div className="animate-fadeIn">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full mb-6 backdrop-blur-md">
                <span className="text-lg">✓</span>
                <span className="font-semibold">Analysis Complete!</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {t('results.title')}
              </h2>
              <p className="text-lg text-neutral-400">
                Based on AI analysis of your farm conditions
              </p>
            </div>

            <FarmingReport
              plan={plan}
              onDownloadPDF={handleDownloadPDF}
              onShare={handleShare}
              onNewPlan={handleNewPlan}
            />
          </div>
        )}

        {/* Error State */}
        {!isLoading && !plan && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-neutral-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-10">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <span className="text-4xl">❌</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Plan Not Found
              </h3>
              <p className="text-neutral-400 mb-6">
                We couldn&apos;t find the farming plan you&apos;re looking for.
              </p>
              <button
                onClick={() => router.push('/input')}
                className="min-h-touch px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
              >
                Create New Plan
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
