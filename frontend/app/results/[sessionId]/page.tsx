// app/results/[sessionId]/page.tsx - Results page showing farming plan

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import { ArrowLeft, Sprout } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
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

      // If still processing, poll again after 3 seconds
      if (data.status === 'processing') {
        setTimeout(() => fetchPlan(), 3000);
      } else {
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
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-yellow-800 font-medium">{error}</p>
            <p className="text-yellow-600 text-sm mt-1">
              Showing demo data for reference
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && plan && plan.status === 'processing' && (
          <div className="mb-12">
            <LoadingProgress
              agentStatuses={plan.agentStatuses || []}
              estimatedTime={30}
            />
          </div>
        )}

        {/* Initial Loading (before plan data arrives) */}
        {isLoading && !plan && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-10">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <span className="text-4xl">🌾</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Preparing Your Analysis
              </h3>
              <p className="text-gray-600 mb-6">
                Our AI agents are getting ready to analyze your farm...
              </p>
            </div>
          </div>
        )}

        {/* Completed Plan */}
        {!isLoading && plan && plan.status === 'completed' && plan.synthesis && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {t('results.title')}
              </h2>
              <p className="text-lg text-gray-600">
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
            <div className="bg-white rounded-2xl shadow-lg p-10">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Plan Not Found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn't find the farming plan you're looking for.
              </p>
              <button
                onClick={() => router.push('/input')}
                className="min-h-touch px-8 py-4 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
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
