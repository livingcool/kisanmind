/**
 * GuidanceQualityOverlay - Enhanced quality overlay with server-side analysis
 *
 * Extends the existing QualityOverlay with server-side analysis results
 * from the video-quality-service. Shows:
 * - Color-coded border (green/yellow/red)
 * - Quality feedback text
 * - Capture readiness indicator
 * - Step progress
 */

'use client';

import { AlertCircle, CheckCircle, AlertTriangle, Camera, Loader2 } from 'lucide-react';

interface GuidanceQualityOverlayProps {
  /** Quality score 0-100 */
  score: number | null;
  /** Whether the frame is acceptable for capture */
  isAcceptable: boolean;
  /** Primary quality issue */
  primaryIssue: string;
  /** Human-readable status text */
  statusText: string;
  /** Overlay border color */
  overlayColor: 'green' | 'yellow' | 'red' | null;
  /** Whether capture is enabled */
  captureEnabled: boolean;
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Current step number */
  stepNumber: number;
  /** Total steps */
  totalSteps: number;
  /** Number of steps captured so far */
  capturedCount: number;
}

export default function GuidanceQualityOverlay({
  score,
  isAcceptable,
  primaryIssue,
  statusText,
  overlayColor,
  captureEnabled,
  isAnalyzing,
  stepNumber,
  totalSteps,
  capturedCount,
}: GuidanceQualityOverlayProps) {
  // Determine colors
  const getBorderColor = () => {
    if (!overlayColor) return 'border-blue-400';
    return {
      green: 'border-green-500',
      yellow: 'border-yellow-500',
      red: 'border-red-500',
    }[overlayColor];
  };

  const getBackgroundGradient = () => {
    if (!overlayColor) return 'from-blue-500/10 to-transparent';
    return {
      green: 'from-green-500/15 via-green-400/5 to-transparent',
      yellow: 'from-yellow-500/15 via-yellow-400/5 to-transparent',
      red: 'from-red-500/15 via-red-400/5 to-transparent',
    }[overlayColor];
  };

  const getBadgeBg = () => {
    if (!overlayColor) return 'bg-blue-100/95';
    return {
      green: 'bg-green-100/95',
      yellow: 'bg-yellow-100/95',
      red: 'bg-red-100/95',
    }[overlayColor];
  };

  const getTextColor = () => {
    if (!overlayColor) return 'text-blue-800';
    return {
      green: 'text-green-800',
      yellow: 'text-yellow-800',
      red: 'text-red-800',
    }[overlayColor];
  };

  const getIcon = () => {
    if (isAnalyzing) return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    if (!overlayColor || overlayColor === 'green') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (overlayColor === 'yellow') return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Border Feedback */}
      <div
        className={`absolute inset-0 border-4 ${getBorderColor()} rounded-2xl transition-colors duration-300 ${
          isAnalyzing ? 'animate-pulse' : ''
        }`}
      />

      {/* Corner Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()} rounded-2xl transition-opacity duration-300`}
      />

      {/* Top Feedback Badge */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
        <div
          className={`${getBadgeBg()} backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border ${getBorderColor()} transition-all duration-300`}
        >
          <div className="flex items-center gap-2">
            {getIcon()}
            <p className={`text-sm font-bold ${getTextColor()}`}>
              {isAnalyzing ? 'Analyzing...' : statusText || 'Point camera at subject'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Badge (top-left) */}
      <div className="absolute top-3 left-3">
        <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <p className="text-xs font-bold text-white">
            Step {stepNumber}/{totalSteps}
          </p>
          <p className="text-xs text-gray-300">
            {capturedCount} captured
          </p>
        </div>
      </div>

      {/* Quality Score Badge (bottom-right) */}
      {score !== null && (
        <div className="absolute bottom-3 right-3">
          <div
            className={`${getBadgeBg()} backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border ${getBorderColor()}`}
          >
            <p className={`text-xs font-bold ${getTextColor()}`}>
              Quality: {score}/100
            </p>
          </div>
        </div>
      )}

      {/* Capture Ready Indicator (bottom-center) */}
      {captureEnabled && !isAnalyzing && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-white" />
              <p className="text-sm font-bold text-white">Ready to capture</p>
            </div>
          </div>
        </div>
      )}

      {/* Grid Overlay for poor quality */}
      {score !== null && score < 50 && (
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
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
