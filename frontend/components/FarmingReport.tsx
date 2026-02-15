// components/FarmingReport.tsx - Display complete farming plan

'use client';

import { useTranslation } from '@/lib/translations';
import {
  Sprout,
  TrendingUp,
  Droplet,
  ShoppingCart,
  Gift,
  AlertTriangle,
  Calendar,
  Download,
  Share2,
} from 'lucide-react';
import { FarmingPlan } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import SchemeCard from './SchemeCard';
import MandiMap from './MandiMap';

interface FarmingReportProps {
  plan: FarmingPlan;
  onDownloadPDF?: () => void;
  onShare?: () => void;
  onNewPlan?: () => void;
}

export default function FarmingReport({
  plan,
  onDownloadPDF,
  onShare,
  onNewPlan,
}: FarmingReportProps) {
  const { t } = useTranslation();

  if (!plan.synthesis) {
    return null;
  }

  const { synthesis } = plan;

  return (
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center print:hidden">
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="min-h-touch px-6 py-3 bg-blue-600/80 backdrop-blur-md text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg border border-blue-400/30"
          >
            <Download className="w-5 h-5" />
            {t('results.actions.downloadPDF')}
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="min-h-touch px-6 py-3 bg-emerald-600/80 backdrop-blur-md text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg border border-emerald-400/30"
          >
            <Share2 className="w-5 h-5" />
            {t('results.actions.share')}
          </button>
        )}
        {onNewPlan && (
          <button
            onClick={onNewPlan}
            className="min-h-touch px-6 py-3 bg-neutral-700/80 backdrop-blur-md text-white font-semibold rounded-xl hover:bg-neutral-600 transition-colors flex items-center gap-2 shadow-lg border border-white/10"
          >
            {t('results.actions.newPlan')}
          </button>
        )}
      </div>

      {/* 1. Recommended Crop */}
      <section className="bg-emerald-900/20 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:bg-emerald-900/30 transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
          <div className="flex-shrink-0 w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sprout className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-xl font-medium text-emerald-400 mb-1 uppercase tracking-wider">
              {t('results.sections.recommendedCrop')}
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              {synthesis.recommendedCrop?.name || 'Not specified'}
            </h3>
            <p className="text-lg text-neutral-300 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {synthesis.recommendedCrop?.variety || 'Not specified'}
            </p>

            {/* Profit Estimate */}
            <div className="bg-neutral-900/40 rounded-xl p-5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-400 mb-1">
                  {t('results.sections.profitEstimate')}
                </p>
                <p className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  {formatCurrency(synthesis.recommendedCrop?.profitEstimate || 0)}
                </p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white/10"></div>
              <div>
                <p className="text-sm font-medium text-neutral-400 mb-1">
                  Estimated Cost
                </p>
                <p className="text-xl font-semibold text-white">
                  {formatCurrency(synthesis.recommendedCrop?.costEstimate || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Layout for Details */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* 2. Sowing Details */}
        <section className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
            {t('results.sections.sowingDetails')}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs font-medium text-neutral-400 mb-1 uppercase">
                  {t('results.sowingFields.sowingDate')}
                </p>
                <p className="text-lg font-bold text-white">
                  {synthesis.sowingDetails.sowingDate}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs font-medium text-neutral-400 mb-1 uppercase">
                  {t('results.sowingFields.seedRate')}
                </p>
                <p className="text-lg font-bold text-white">
                  {synthesis.sowingDetails.seedRate}
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs font-medium text-neutral-400 mb-1 uppercase">
                {t('results.sowingFields.spacing')}
              </p>
              <p className="text-base text-white">
                {synthesis.sowingDetails.spacing}
              </p>
            </div>

            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <p className="text-xs font-medium text-blue-300 mb-1 uppercase">
                Soil Preparation
              </p>
              <p className="text-base text-blue-100">
                {synthesis.sowingDetails.soilPreparation}
              </p>
            </div>
          </div>
        </section>

        {/* 3. Water Management */}
        <section className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
            <Droplet className="w-6 h-6 text-cyan-400" />
            {t('results.sections.waterManagement')}
          </h2>
          <div className="space-y-4">
            <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
              <p className="text-xs font-medium text-cyan-300 mb-1 uppercase">
                Water Requirement
              </p>
              <p className="text-base text-cyan-100 font-medium">
                {synthesis.waterManagement.waterRequirement}
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs font-medium text-neutral-400 mb-1 uppercase">
                Irrigation Schedule
              </p>
              <p className="text-base text-white">
                {synthesis.waterManagement.irrigationSchedule}
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs font-medium text-neutral-400 mb-3 uppercase">
                Key Recommendations
              </p>
              <ul className="space-y-2">
                {synthesis.waterManagement.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-neutral-300 leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Selling Strategy */}
      <section className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
          <ShoppingCart className="w-6 h-6 text-amber-400" />
          {t('results.sections.sellingStrategy')}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-300 mb-1 uppercase">
                Expected Price
              </p>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(synthesis.sellingStrategy.expectedPrice)}/quintal
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs font-medium text-neutral-400 mb-1 uppercase">
                Best Selling Time
              </p>
              <p className="text-lg font-medium text-white">
                {synthesis.sellingStrategy.bestSellingTime}
              </p>
            </div>
          </div>

          {/* Mandi Map Placeholder area */}
          <div className="bg-neutral-800/50 rounded-xl border border-white/5 overflow-hidden min-h-[200px]">
            {synthesis.sellingStrategy.nearbyMandis.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="p-3 bg-white/5 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white">
                    {t('results.nearbyMandis')}
                  </h3>
                </div>
                <div className="flex-1">
                  <MandiMap
                    farmerLocation={
                      synthesis.sellingStrategy.nearbyMandis[0]?.coordinates || {
                        lat: 20.9,
                        lon: 77.75,
                      }
                    }
                    mandis={synthesis.sellingStrategy.nearbyMandis.map((mandi) => ({
                      id: mandi.name,
                      name: mandi.name,
                      district: '',
                      state: '',
                      coordinates: mandi.coordinates,
                      distance: mandi.distance,
                      currentPrices: [
                        {
                          commodity: synthesis.recommendedCrop.name,
                          price: mandi.currentPrice,
                          unit: 'quintal',
                          date: new Date().toISOString(),
                        },
                      ],
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                Map Unavailable
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid for Risk & Action */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* 6. Risk Warnings */}
        <section className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            {t('results.sections.riskWarnings')}
          </h2>
          <div className="space-y-3">
            {synthesis.riskWarnings.map((warning, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-4 border-l-4 ${warning.severity === 'high'
                    ? 'bg-red-900/10 border-red-500'
                    : warning.severity === 'medium'
                      ? 'bg-yellow-900/10 border-yellow-500'
                      : 'bg-blue-900/10 border-blue-500'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warning.severity === 'high'
                        ? 'text-red-500'
                        : warning.severity === 'medium'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-white mb-1">{warning.risk}</p>
                    <p className="text-sm text-neutral-300">
                      <span className="font-semibold text-neutral-400 opacity-80">Mitigation:</span>{' '}
                      {warning.mitigation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Month-by-Month Action Plan */}
        <section className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
            <Calendar className="w-6 h-6 text-purple-400" />
            {t('results.sections.actionPlan')}
          </h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {synthesis.actionPlan.map((monthPlan, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <h3 className="text-md font-bold text-purple-300 mb-3 border-b border-white/5 pb-2">
                  {monthPlan.month}
                </h3>
                <ul className="space-y-3">
                  {monthPlan.activities.map((activity, actIdx) => (
                    <li key={actIdx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-purple-500/20 text-purple-300 rounded-full flex items-center justify-center text-xs font-bold border border-purple-500/30">
                        {actIdx + 1}
                      </span>
                      <span className="text-sm text-neutral-300 flex-1 leading-relaxed">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 5. Government Schemes */}
      <section className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
          <Gift className="w-6 h-6 text-green-400" />
          {t('results.sections.governmentSchemes')}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {synthesis.governmentSchemes.map((scheme, idx) => (
            <div key={idx} className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-green-500/30 transition-all hover:bg-white/10">
              <h3 className="font-bold text-white mb-2 text-lg">{scheme.name}</h3>
              <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{scheme.details}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-300 border border-green-500/30">
                  Subsidy
                </span>
                {scheme.link && (
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1">
                    Visit Site ↗
                  </a>
                )}
              </div>
            </div>
            // Note: If SchemeCard is a separate component, it's better to update that. 
            // For now replacing with inline for theme consistency as SchemeCard logic wasn't viewed.
            // <SchemeCard key={idx} scheme={scheme} /> 
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-6 print:hidden">
        <p className="text-sm text-neutral-500 mb-2">
          Generated by KisanMind - AI-Powered Agricultural Intelligence
        </p>
        <p className="text-xs text-neutral-600">
          Powered by Claude Opus 4.6 | Generated on {formatDate(new Date())}
        </p>
      </div>
    </div>
  );
}

/**
 * Usage example:
 *
 * import FarmingReport from '@/components/FarmingReport';
 *
 * <FarmingReport
 *   plan={farmingPlan}
 *   onDownloadPDF={() => console.log('Download PDF')}
 *   onShare={() => console.log('Share plan')}
 *   onNewPlan={() => console.log('New plan')}
 * />
 */
