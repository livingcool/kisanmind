// components/VideoGuidance/QualityOverlay.tsx - Visual feedback overlay for camera quality

'use client';

import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { QualityResult } from './hooks/useImageQuality';

interface QualityOverlayProps {
  quality: QualityResult | null;
  isAnalyzing: boolean;
}

export default function QualityOverlay({
  quality,
  isAnalyzing,
}: QualityOverlayProps) {
  if (isAnalyzing) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border-4 border-blue-400 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!quality) return null;

  // Determine border color and feedback style based on score
  const getBorderColor = () => {
    if (quality.score >= 80) return 'border-green-500';
    if (quality.score >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  const getBackgroundGradient = () => {
    if (quality.score >= 80)
      return 'from-green-500/20 via-green-400/10 to-transparent';
    if (quality.score >= 60)
      return 'from-yellow-500/20 via-yellow-400/10 to-transparent';
    return 'from-red-500/20 via-red-400/10 to-transparent';
  };

  const getIcon = () => {
    if (quality.score >= 80)
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (quality.score >= 60)
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const getTextColor = () => {
    if (quality.score >= 80) return 'text-green-800';
    if (quality.score >= 60) return 'text-yellow-800';
    return 'text-red-800';
  };

  const getBgColor = () => {
    if (quality.score >= 80) return 'bg-green-100/95';
    if (quality.score >= 60) return 'bg-yellow-100/95';
    return 'bg-red-100/95';
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Border Feedback */}
      <div
        className={`absolute inset-0 border-4 ${getBorderColor()} rounded-2xl transition-colors duration-300`}
      />

      {/* Corner Gradient Overlays */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()} rounded-2xl transition-opacity duration-300`}
      />

      {/* Feedback Badge */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <div
          className={`${getBgColor()} backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 ${getBorderColor()} transition-all duration-300`}
        >
          <div className="flex items-center gap-2">
            {getIcon()}
            <div>
              <p className={`text-sm font-bold ${getTextColor()}`}>
                {quality.feedback}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Score Badge (Bottom) */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div
          className={`${getBgColor()} backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border ${getBorderColor()}`}
        >
          <p className={`text-xs font-bold ${getTextColor()}`}>
            Quality: {quality.score}/100
          </p>
        </div>
      </div>

      {/* Grid Overlay (for composition guidance) */}
      {quality.score < 60 && (
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Rule of thirds grid */}
          <line
            x1="33.33%"
            y1="0"
            x2="33.33%"
            y2="100%"
            stroke="white"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          <line
            x1="66.66%"
            y1="0"
            x2="66.66%"
            y2="100%"
            stroke="white"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          <line
            x1="0"
            y1="33.33%"
            x2="100%"
            y2="33.33%"
            stroke="white"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          <line
            x1="0"
            y1="66.66%"
            x2="100%"
            y2="66.66%"
            stroke="white"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        </svg>
      )}
    </div>
  );
}

/**
 * Usage:
 * <div className="relative">
 *   <video ref={videoRef} />
 *   <QualityOverlay quality={qualityResult} isAnalyzing={false} />
 * </div>
 */
