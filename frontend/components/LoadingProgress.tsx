// components/LoadingProgress.tsx - Animated loading progress for agent analysis

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/translations';
import { Loader2, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { AgentStatus } from '@/lib/api';

interface LoadingProgressProps {
  agentStatuses: AgentStatus[];
  estimatedTime?: number; // in seconds
}

export default function LoadingProgress({
  agentStatuses,
  estimatedTime = 30,
}: LoadingProgressProps) {
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Safe calculation with fallback for undefined or empty agentStatuses
  const overallProgress = agentStatuses && agentStatuses.length > 0
    ? Math.round(
      agentStatuses.reduce((sum, agent) => sum + agent.progress, 0) /
      agentStatuses.length
    )
    : 0;

  const remainingTime = Math.max(0, estimatedTime - elapsedTime);

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'running':
        return <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />;
      default:
        return <Circle className="w-6 h-6 text-neutral-600" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-neutral-900/40 border border-white/10 backdrop-blur-xl rounded-3xl shadow-xl">
      {/* Overall Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            {t('results.analyzing')}
          </h3>
          <span className="text-2xl font-bold text-emerald-400">
            {overallProgress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-800/50 rounded-full h-3 overflow-hidden border border-white/5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${overallProgress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>

        {/* Time Remaining */}
        {remainingTime > 0 && (
          <p className="text-sm text-neutral-400 mt-3 text-center">
            Estimated time remaining: {Math.floor(remainingTime / 60)}:
            {(remainingTime % 60).toString().padStart(2, '0')}
          </p>
        )}
      </div>

      {/* Individual Agent Status */}
      <div className="space-y-4">
        {agentStatuses && agentStatuses.length > 0 ? agentStatuses.map((agent, index) => (
          <div
            key={agent.name}
            className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all duration-300 hover:bg-white/10"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-1">{getStatusIcon(agent.status)}</div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium text-white">{agent.name}</h4>
                <span className={`text-sm font-semibold ${agent.status === 'completed' ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {agent.progress}%
                </span>
              </div>

              <p className="text-sm text-neutral-400 mb-2">{agent.message}</p>

              {/* Individual Progress Bar */}
              {agent.status === 'running' && (
                <div className="w-full bg-neutral-700/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${agent.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-neutral-400">Initializing AI agents...</p>
          </div>
        )}
      </div>

      {/* Animated Illustration */}
      <div className="mt-8 flex justify-center">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-75"></div>
          <div className="relative flex items-center justify-center w-full h-full bg-neutral-900/80 border border-emerald-500/30 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <svg
              className="w-12 h-12 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Usage example:
 *
 * import LoadingProgress from '@/components/LoadingProgress';
 *
 * const agentStatuses = [
 *   { name: 'Ground Analyzer', status: 'completed', progress: 100, message: 'Soil analysis complete' },
 *   { name: 'Water Assessor', status: 'running', progress: 65, message: 'Checking water quality...' },
 *   // ... more agents
 * ];
 *
 * <LoadingProgress agentStatuses={agentStatuses} estimatedTime={30} />
 */
