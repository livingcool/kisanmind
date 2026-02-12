// components/FarmingReport.tsx - Display complete farming plan

'use client';

import { useTranslation } from 'react-i18next';
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center print:hidden">
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="min-h-touch px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
          >
            <Download className="w-5 h-5" />
            {t('results.actions.downloadPDF')}
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="min-h-touch px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
          >
            <Share2 className="w-5 h-5" />
            {t('results.actions.share')}
          </button>
        )}
        {onNewPlan && (
          <button
            onClick={onNewPlan}
            className="min-h-touch px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-md"
          >
            {t('results.actions.newPlan')}
          </button>
        )}
      </div>

      {/* 1. Recommended Crop */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('results.sections.recommendedCrop')}
            </h2>
            <h3 className="text-3xl font-extrabold text-green-700 mb-3">
              {synthesis.recommendedCrop.name}
            </h3>
            <p className="text-lg text-gray-700 mb-4">
              <span className="font-semibold">Variety:</span>{' '}
              {synthesis.recommendedCrop.variety}
            </p>

            {/* Profit Estimate */}
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <p className="text-sm font-semibold text-gray-600 mb-1">
                {t('results.sections.profitEstimate')}
              </p>
              <p className="text-3xl font-extrabold text-green-600 flex items-center gap-2">
                <TrendingUp className="w-8 h-8" />
                {formatCurrency(synthesis.recommendedCrop.profitEstimate)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Cost: {formatCurrency(synthesis.recommendedCrop.costEstimate)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sowing Details */}
      <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Calendar className="w-7 h-7 text-primary-600" />
          {t('results.sections.sowingDetails')}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              {t('results.sowingFields.sowingDate')}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {synthesis.sowingDetails.sowingDate}
            </p>
          </div>
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              {t('results.sowingFields.spacing')}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {synthesis.sowingDetails.spacing}
            </p>
          </div>
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              {t('results.sowingFields.seedRate')}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {synthesis.sowingDetails.seedRate}
            </p>
          </div>
          <div className="bg-primary-50 rounded-lg p-4 md:col-span-2">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Soil Preparation
            </p>
            <p className="text-base text-gray-900">
              {synthesis.sowingDetails.soilPreparation}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Water Management */}
      <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Droplet className="w-7 h-7 text-water-600" />
          {t('results.sections.waterManagement')}
        </h2>
        <div className="space-y-3">
          <div className="bg-water-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Irrigation Schedule
            </p>
            <p className="text-base text-gray-900">
              {synthesis.waterManagement.irrigationSchedule}
            </p>
          </div>
          <div className="bg-water-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Water Requirement
            </p>
            <p className="text-base text-gray-900">
              {synthesis.waterManagement.waterRequirement}
            </p>
          </div>
          <div className="bg-water-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              Key Recommendations
            </p>
            <ul className="space-y-2">
              {synthesis.waterManagement.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-water-600 font-bold">•</span>
                  <span className="text-base text-gray-900">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Selling Strategy */}
      <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-orange-600" />
          {t('results.sections.sellingStrategy')}
        </h2>

        <div className="mb-6 bg-orange-50 rounded-lg p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Best Selling Time
              </p>
              <p className="text-lg font-bold text-gray-900">
                {synthesis.sellingStrategy.bestSellingTime}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Expected Price
              </p>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(synthesis.sellingStrategy.expectedPrice)}/quintal
              </p>
            </div>
          </div>
        </div>

        {/* Mandi Map */}
        {synthesis.sellingStrategy.nearbyMandis.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              {t('results.nearbyMandis')}
            </h3>
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
        )}
      </section>

      {/* 5. Government Schemes */}
      <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Gift className="w-7 h-7 text-green-600" />
          {t('results.sections.governmentSchemes')}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {synthesis.governmentSchemes.map((scheme, idx) => (
            <SchemeCard key={idx} scheme={scheme} />
          ))}
        </div>
      </section>

      {/* 6. Risk Warnings */}
      <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-yellow-600" />
          {t('results.sections.riskWarnings')}
        </h2>
        <div className="space-y-3">
          {synthesis.riskWarnings.map((warning, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-4 border-l-4 ${
                warning.severity === 'high'
                  ? 'bg-red-50 border-red-500'
                  : warning.severity === 'medium'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    warning.severity === 'high'
                      ? 'text-red-600'
                      : warning.severity === 'medium'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 mb-1">{warning.risk}</p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Mitigation:</span>{' '}
                    {warning.mitigation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Month-by-Month Action Plan */}
      <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Calendar className="w-7 h-7 text-purple-600" />
          {t('results.sections.actionPlan')}
        </h2>
        <div className="space-y-4">
          {synthesis.actionPlan.map((monthPlan, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200"
            >
              <h3 className="text-lg font-bold text-purple-900 mb-3">
                {monthPlan.month}
              </h3>
              <ul className="space-y-2">
                {monthPlan.activities.map((activity, actIdx) => (
                  <li key={actIdx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {actIdx + 1}
                    </span>
                    <span className="text-base text-gray-900 flex-1">{activity}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-6 print:hidden">
        <p className="text-sm text-gray-500 mb-2">
          Generated by KisanMind - AI-Powered Agricultural Intelligence
        </p>
        <p className="text-xs text-gray-400">
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
