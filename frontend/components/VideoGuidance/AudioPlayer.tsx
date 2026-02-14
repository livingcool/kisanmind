/**
 * AudioPlayer - Visual indicator for TTS audio playback
 *
 * Shows a small floating indicator when audio instructions are playing.
 * Provides controls to mute/unmute audio guidance.
 */

'use client';

import { useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  currentText: string | null;
  language: string;
  queueLength: number;
  onMuteToggle: () => void;
  isMuted: boolean;
}

export default function AudioPlayer({
  isPlaying,
  currentText,
  language,
  queueLength,
  onMuteToggle,
  isMuted,
}: AudioPlayerProps) {
  const [expanded, setExpanded] = useState(false);

  // Language display names
  const langNames: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
    ta: 'Tamil',
    te: 'Telugu',
  };

  // Don't render if nothing to show
  if (!isPlaying && !currentText && queueLength === 0) {
    return (
      <div className="fixed bottom-24 right-4 z-30">
        <button
          onClick={onMuteToggle}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-gray-700 border border-gray-200'
          }`}
          title={isMuted ? 'Unmute audio guidance' : 'Mute audio guidance'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-30 max-w-xs">
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border transition-all duration-300 overflow-hidden ${
          isPlaying ? 'border-primary-400' : 'border-gray-200'
        }`}
      >
        {/* Compact view */}
        <div
          className="flex items-center gap-3 p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Audio icon / animation */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isPlaying
                ? 'bg-primary-100'
                : isMuted
                ? 'bg-red-100'
                : 'bg-gray-100'
            }`}
          >
            {isPlaying ? (
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-3 bg-primary-600 rounded-full animate-audio-bar-1" />
                <div className="w-1 h-4 bg-primary-600 rounded-full animate-audio-bar-2" />
                <div className="w-1 h-2 bg-primary-600 rounded-full animate-audio-bar-3" />
                <div className="w-1 h-3 bg-primary-600 rounded-full animate-audio-bar-1" />
              </div>
            ) : isMuted ? (
              <VolumeX className="w-5 h-5 text-red-600" />
            ) : (
              <Volume2 className="w-5 h-5 text-gray-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">
              {isPlaying
                ? 'Speaking...'
                : isMuted
                ? 'Audio muted'
                : 'Audio guidance'}
            </p>
            <p className="text-xs text-gray-500">
              {langNames[language] || language}
              {queueLength > 0 && ` (+${queueLength} queued)`}
            </p>
          </div>

          {/* Mute button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle();
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              isMuted
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Expanded: show current text */}
        {expanded && currentText && (
          <div className="px-3 pb-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              {currentText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
