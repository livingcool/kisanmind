// components/SchemeCard.tsx - Government scheme display card

'use client';

import { ExternalLink, CheckCircle, Gift } from 'lucide-react';

interface SchemeCardProps {
  scheme: {
    name: string;
    description: string;
    eligibility: string;
    benefit: string;
    applicationLink?: string;
  };
}

export default function SchemeCard({ scheme }: SchemeCardProps) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{scheme.name}</h3>
          <p className="text-sm text-gray-600">{scheme.description}</p>
        </div>
      </div>

      {/* Benefit */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Benefit:</p>
            <p className="text-base text-gray-900 font-medium">{scheme.benefit}</p>
          </div>
        </div>
      </div>

      {/* Eligibility */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Eligibility:</p>
        <p className="text-sm text-gray-600 leading-relaxed">{scheme.eligibility}</p>
      </div>

      {/* Application Link */}
      {scheme.applicationLink && (
        <a
          href={scheme.applicationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 min-h-touch px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          Apply Now
          <ExternalLink className="w-4 h-4" />
        </a>
      )}

      {/* Disclaimer */}
      <p className="mt-4 text-xs text-gray-500 italic">
        * Please verify eligibility and application process with your local agriculture office
      </p>
    </div>
  );
}

/**
 * Usage example:
 *
 * import SchemeCard from '@/components/SchemeCard';
 *
 * const scheme = {
 *   name: "PM-KISAN",
 *   description: "Direct income support to farmer families",
 *   eligibility: "All landholding farmer families",
 *   benefit: "₹6000 per year in 3 installments",
 *   applicationLink: "https://pmkisan.gov.in/"
 * };
 *
 * <SchemeCard scheme={scheme} />
 */
