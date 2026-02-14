/**
 * useAudioPlayback - Hook for playing TTS audio instructions
 *
 * Supports two modes:
 * 1. File mode: Plays pre-generated audio from server URL
 * 2. Client Speech mode: Uses the browser Web Speech API (SpeechSynthesis)
 *
 * The hook manages a queue so instructions do not overlap. Each new instruction
 * is either appended to the queue (default) or interrupts the current one.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TTSMode = 'file' | 'client_speech' | 'external_api';

export interface TTSInstruction {
  mode: TTSMode;
  instructionId: string;
  language: string;
  text: string;
  audioPath?: string;
  audioData?: string;
  mimeType?: string;
  estimatedDuration: number;
  speechApiLang?: string;
}

export interface AudioPlaybackState {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** The instruction currently being played */
  currentInstruction: TTSInstruction | null;
  /** Number of instructions waiting in the queue */
  queueLength: number;
  /** Whether Web Speech API is available in this browser */
  speechApiAvailable: boolean;
  /** Whether the user has interacted (needed for autoplay policy) */
  userInteracted: boolean;
  /** Error message if playback failed */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAudioPlayback() {
  const [state, setState] = useState<AudioPlaybackState>({
    isPlaying: false,
    currentInstruction: null,
    queueLength: 0,
    speechApiAvailable: false,
    userInteracted: false,
    error: null,
  });

  const queueRef = useRef<TTSInstruction[]>([]);
  const isPlayingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef(true);

  // Check Web Speech API availability
  useEffect(() => {
    const available = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setState(prev => ({ ...prev, speechApiAvailable: available }));

    return () => {
      isMountedRef.current = false;
      // Cleanup on unmount
      stopAll();
    };
  }, []);

  // Track user interaction (needed to unlock audio autoplay)
  useEffect(() => {
    const handleInteraction = () => {
      setState(prev => ({ ...prev, userInteracted: true }));
      // Also resume AudioContext if suspended
      if (audioRef.current) {
        audioRef.current.load();
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  /**
   * Play the next instruction in the queue.
   */
  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;

    const instruction = queueRef.current.shift()!;
    isPlayingRef.current = true;

    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        isPlaying: true,
        currentInstruction: instruction,
        queueLength: queueRef.current.length,
        error: null,
      }));
    }

    try {
      if (instruction.mode === 'file' && instruction.audioPath) {
        await playAudioFile(instruction);
      } else {
        await playSpeechSynthesis(instruction);
      }
    } catch (error) {
      console.warn('[AudioPlayback] Playback failed:', error);
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Playback failed',
        }));
      }
    }

    isPlayingRef.current = false;
    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentInstruction: null,
        queueLength: queueRef.current.length,
      }));
    }

    // Process next in queue
    if (queueRef.current.length > 0) {
      // Small delay between instructions
      setTimeout(() => processQueue(), 300);
    }
  }, []);

  /**
   * Play a pre-generated audio file.
   */
  const playAudioFile = useCallback((instruction: TTSInstruction): Promise<void> => {
    return new Promise((resolve, reject) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const audio = new Audio(`${API_URL}${instruction.audioPath}`);
      audioRef.current = audio;

      audio.onended = () => {
        audioRef.current = null;
        resolve();
      };

      audio.onerror = () => {
        audioRef.current = null;
        // Fall back to speech synthesis
        console.warn('[AudioPlayback] Audio file failed, falling back to Speech API');
        playSpeechSynthesis(instruction).then(resolve).catch(reject);
      };

      audio.play().catch(err => {
        // Autoplay blocked - fall back to speech synthesis
        console.warn('[AudioPlayback] Autoplay blocked:', err);
        playSpeechSynthesis(instruction).then(resolve).catch(reject);
      });
    });
  }, []);

  /**
   * Play using the Web Speech API.
   */
  const playSpeechSynthesis = useCallback((instruction: TTSInstruction): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        // No speech synthesis available; just wait the estimated duration
        setTimeout(resolve, instruction.estimatedDuration);
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(instruction.text);
      utteranceRef.current = utterance;

      // Set language
      utterance.lang = instruction.speechApiLang ?? 'en-IN';

      // Set voice parameters
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = utterance.lang.split('-')[0];
      const matchingVoice = voices.find(
        v => v.lang === utterance.lang || v.lang.startsWith(langPrefix),
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        utteranceRef.current = null;
        resolve();
      };

      utterance.onerror = (event) => {
        utteranceRef.current = null;
        // 'canceled' is expected when we interrupt
        if (event.error === 'canceled') {
          resolve();
        } else {
          console.warn('[AudioPlayback] Speech synthesis error:', event.error);
          // Don't reject - just resolve after estimated duration
          setTimeout(resolve, Math.min(instruction.estimatedDuration, 2000));
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  /**
   * Enqueue a TTS instruction for playback.
   *
   * @param instruction - The TTS instruction to play
   * @param interrupt - If true, clear the queue and play immediately
   */
  const play = useCallback((instruction: TTSInstruction, interrupt: boolean = false) => {
    if (interrupt) {
      // Clear queue and stop current playback
      queueRef.current = [];
      stopCurrent();
    }

    queueRef.current.push(instruction);

    if (isMountedRef.current) {
      setState(prev => ({ ...prev, queueLength: queueRef.current.length }));
    }

    // Start processing if not already playing
    if (!isPlayingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  /**
   * Stop the currently playing audio.
   */
  const stopCurrent = useCallback(() => {
    // Stop HTML audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Stop speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = null;
    isPlayingRef.current = false;
  }, []);

  /**
   * Stop all audio and clear the queue.
   */
  const stopAll = useCallback(() => {
    queueRef.current = [];
    stopCurrent();

    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentInstruction: null,
        queueLength: 0,
      }));
    }
  }, [stopCurrent]);

  return {
    ...state,
    play,
    stopCurrent,
    stopAll,
  };
}
