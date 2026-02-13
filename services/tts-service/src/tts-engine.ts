/**
 * TTS Engine - Server-side text-to-speech generation
 *
 * Provides multiple TTS backends:
 * 1. Pre-generated audio files (fastest, no external dependency)
 * 2. Client-hint mode (returns text + language for Web Speech API on client)
 * 3. External TTS API integration (AI4Bharat / Google TTS - future)
 *
 * For the hackathon, we use pre-generated files + client-side Web Speech API
 * as fallback. This avoids external TTS API dependencies while supporting
 * all 4 Indian languages.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  type SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getTranslation,
  getPreGenerationManifest,
} from './translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Audio files directory (relative to service root)
const AUDIO_DIR = path.resolve(__dirname, '..', 'audio');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TTSResult {
  /** How the audio is delivered */
  mode: 'file' | 'client_speech' | 'external_api';
  /** Instruction ID */
  instructionId: string;
  /** Language code */
  language: SupportedLanguage;
  /** The text that should be spoken */
  text: string;
  /** URL path to pre-generated audio file (when mode = 'file') */
  audioPath?: string;
  /** Base64-encoded audio data (when mode = 'external_api') */
  audioData?: string;
  /** Audio MIME type */
  mimeType?: string;
  /** Estimated duration in milliseconds */
  estimatedDuration: number;
}

export interface TTSEngineConfig {
  /** Directory where pre-generated audio files are stored */
  audioDir?: string;
  /** Whether to prefer pre-generated files over dynamic generation */
  preferPreGenerated?: boolean;
  /** BCP-47 voice map for Web Speech API hints */
  voiceMap?: Record<SupportedLanguage, string>;
}

// ---------------------------------------------------------------------------
// BCP-47 language tags for Web Speech API
// ---------------------------------------------------------------------------

const SPEECH_API_LANG_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

// Approximate speaking rates (words per minute) for duration estimation
const SPEAKING_RATE: Record<SupportedLanguage, number> = {
  en: 150,
  hi: 120,
  mr: 120,
  ta: 110,
  te: 110,
};

// ---------------------------------------------------------------------------
// TTS Engine
// ---------------------------------------------------------------------------

export class TTSEngine {
  private audioDir: string;
  private preferPreGenerated: boolean;
  private availableFiles: Set<string> = new Set();

  constructor(config: TTSEngineConfig = {}) {
    this.audioDir = config.audioDir ?? AUDIO_DIR;
    this.preferPreGenerated = config.preferPreGenerated ?? true;
    this.scanAvailableFiles();
  }

  /**
   * Scan the audio directory for pre-generated files.
   * Files are expected at: {audioDir}/{language}/{instructionId}.mp3
   */
  private scanAvailableFiles(): void {
    this.availableFiles.clear();

    for (const lang of SUPPORTED_LANGUAGES) {
      const langDir = path.join(this.audioDir, lang);
      if (!fs.existsSync(langDir)) continue;

      try {
        const files = fs.readdirSync(langDir);
        for (const file of files) {
          if (file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg')) {
            const id = path.basename(file, path.extname(file));
            this.availableFiles.add(`${lang}/${id}`);
          }
        }
      } catch {
        // Directory read failed, skip
      }
    }

    console.log(`[TTS] Scanned audio directory: ${this.availableFiles.size} pre-generated files found`);
  }

  /**
   * Check if a pre-generated audio file exists for the given instruction + language.
   */
  hasPreGenerated(instructionId: string, language: SupportedLanguage): boolean {
    return this.availableFiles.has(`${language}/${instructionId}`);
  }

  /**
   * Get the file system path for a pre-generated audio file.
   */
  getAudioFilePath(instructionId: string, language: SupportedLanguage): string | null {
    for (const ext of ['.mp3', '.wav', '.ogg']) {
      const filePath = path.join(this.audioDir, language, `${instructionId}${ext}`);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  }

  /**
   * Generate or retrieve TTS output for a given instruction.
   *
   * Resolution order:
   * 1. Pre-generated audio file (if available and preferred)
   * 2. Client-side Web Speech API hint (always available)
   */
  async synthesize(
    instructionId: string,
    language: SupportedLanguage,
  ): Promise<TTSResult> {
    const text = getTranslation(instructionId, language);
    if (!text) {
      throw new Error(`Unknown instruction: ${instructionId}`);
    }

    // Estimate duration based on word count and speaking rate
    const wordCount = text.split(/\s+/).length;
    const wpm = SPEAKING_RATE[language] ?? 130;
    const estimatedDuration = Math.max(1000, Math.round((wordCount / wpm) * 60 * 1000));

    // Try pre-generated file first
    if (this.preferPreGenerated) {
      const filePath = this.getAudioFilePath(instructionId, language);
      if (filePath) {
        const ext = path.extname(filePath).slice(1);
        const mimeMap: Record<string, string> = {
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          ogg: 'audio/ogg',
        };

        return {
          mode: 'file',
          instructionId,
          language,
          text,
          audioPath: `/api/tts/audio/${language}/${instructionId}.${ext}`,
          mimeType: mimeMap[ext] ?? 'audio/mpeg',
          estimatedDuration,
        };
      }
    }

    // Fall back to client-side Web Speech API
    return {
      mode: 'client_speech',
      instructionId,
      language,
      text,
      estimatedDuration,
    };
  }

  /**
   * Generate TTS for arbitrary text (not from instruction templates).
   * Always uses client_speech mode since we cannot pre-generate dynamic text.
   */
  async synthesizeDynamic(
    text: string,
    language: SupportedLanguage,
  ): Promise<TTSResult> {
    const wordCount = text.split(/\s+/).length;
    const wpm = SPEAKING_RATE[language] ?? 130;
    const estimatedDuration = Math.max(1000, Math.round((wordCount / wpm) * 60 * 1000));

    return {
      mode: 'client_speech',
      instructionId: 'dynamic',
      language,
      text,
      estimatedDuration,
    };
  }

  /**
   * Get the BCP-47 language tag for the Web Speech API.
   */
  getSpeechApiLang(language: SupportedLanguage): string {
    return SPEECH_API_LANG_MAP[language] ?? 'en-IN';
  }

  /**
   * Get the manifest of all instructions that should be pre-generated.
   */
  getPreGenerationManifest() {
    return getPreGenerationManifest();
  }

  /**
   * Get list of available pre-generated audio files.
   */
  getAvailableFiles(): string[] {
    return Array.from(this.availableFiles);
  }

  /**
   * Refresh the cache of available audio files.
   */
  refresh(): void {
    this.scanAvailableFiles();
  }
}

// Singleton instance
let engineInstance: TTSEngine | null = null;

export function getTTSEngine(config?: TTSEngineConfig): TTSEngine {
  if (!engineInstance) {
    engineInstance = new TTSEngine(config);
  }
  return engineInstance;
}
