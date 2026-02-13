/**
 * TTS Service - Express Server
 *
 * Provides REST endpoints for text-to-speech in 5 languages (en, hi, mr, ta, te).
 *
 * Endpoints:
 *   POST /api/tts/synthesize       - Generate TTS for an instruction ID
 *   POST /api/tts/synthesize-text   - Generate TTS for arbitrary text
 *   GET  /api/tts/audio/:lang/:id   - Serve pre-generated audio file
 *   GET  /api/tts/instructions       - List all available instructions
 *   GET  /api/tts/manifest           - Pre-generation manifest
 *   GET  /health                     - Health check
 *
 * Port: 8200 (configurable via TTS_PORT env var)
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTTSEngine } from './tts-engine.js';
import { getAudioCache } from './audio-cache.js';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  type SupportedLanguage,
  getAllInstructions,
} from './translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.TTS_PORT || 8200;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Service instances
// ---------------------------------------------------------------------------

const engine = getTTSEngine();
const cache = getAudioCache();

// Warm the cache on startup with all known instructions
(async () => {
  const instructions = getAllInstructions();
  let warmed = 0;
  for (const instruction of instructions) {
    for (const lang of SUPPORTED_LANGUAGES) {
      try {
        const result = await engine.synthesize(instruction.id, lang);
        cache.set(instruction.id, lang, result);
        warmed++;
      } catch {
        // Skip failures during warm-up
      }
    }
  }
  console.log(`[TTS] Cache warmed with ${warmed} entries`);
})();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * Health check
 */
app.get('/health', (_req: Request, res: Response) => {
  const stats = cache.getStats();
  res.json({
    status: 'healthy',
    service: 'tts-service',
    timestamp: new Date().toISOString(),
    supportedLanguages: SUPPORTED_LANGUAGES,
    cache: stats,
    preGeneratedFiles: engine.getAvailableFiles().length,
  });
});

/**
 * POST /api/tts/synthesize
 *
 * Generate TTS for a known instruction ID.
 *
 * Body: { instructionId: string, language: SupportedLanguage }
 * Response: TTSResult
 */
app.post('/api/tts/synthesize', async (req: Request, res: Response) => {
  try {
    const { instructionId, language } = req.body;

    if (!instructionId) {
      return res.status(400).json({ error: 'Missing required field: instructionId' });
    }

    const lang = (language as SupportedLanguage) || 'en';
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      return res.status(400).json({
        error: `Unsupported language: ${lang}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
      });
    }

    // Check cache first
    const cached = cache.get(instructionId, lang);
    if (cached) {
      return res.json({
        ...cached,
        cached: true,
        speechApiLang: engine.getSpeechApiLang(lang),
      });
    }

    // Synthesize
    const result = await engine.synthesize(instructionId, lang);
    cache.set(instructionId, lang, result);

    res.json({
      ...result,
      cached: false,
      speechApiLang: engine.getSpeechApiLang(lang),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[TTS] Synthesize error:', msg);
    res.status(500).json({ error: 'TTS synthesis failed', message: msg });
  }
});

/**
 * POST /api/tts/synthesize-text
 *
 * Generate TTS for arbitrary text (not from instruction templates).
 *
 * Body: { text: string, language: SupportedLanguage }
 * Response: TTSResult
 */
app.post('/api/tts/synthesize-text', async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    const lang = (language as SupportedLanguage) || 'en';
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      return res.status(400).json({
        error: `Unsupported language: ${lang}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
      });
    }

    const result = await engine.synthesizeDynamic(text, lang);

    res.json({
      ...result,
      speechApiLang: engine.getSpeechApiLang(lang),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[TTS] Dynamic synthesis error:', msg);
    res.status(500).json({ error: 'TTS synthesis failed', message: msg });
  }
});

/**
 * GET /api/tts/audio/:language/:instructionId
 *
 * Serve a pre-generated audio file.
 * Falls back to JSON with client_speech hint if file not found.
 */
app.get('/api/tts/audio/:language/:instructionId', (req: Request, res: Response) => {
  const { language, instructionId } = req.params;
  const lang = language as SupportedLanguage;

  // Strip extension from instruction ID if present
  const id = instructionId.replace(/\.(mp3|wav|ogg)$/, '');

  const filePath = engine.getAudioFilePath(id, lang);

  if (filePath) {
    return res.sendFile(filePath);
  }

  // No pre-generated file; return client speech hint
  res.status(404).json({
    error: 'Pre-generated audio not found',
    fallback: 'client_speech',
    instructionId: id,
    language: lang,
    speechApiLang: engine.getSpeechApiLang(lang),
  });
});

/**
 * GET /api/tts/instructions
 *
 * List all available instruction templates with their translations.
 */
app.get('/api/tts/instructions', (_req: Request, res: Response) => {
  const instructions = getAllInstructions();
  res.json({
    count: instructions.length,
    languages: LANGUAGE_NAMES,
    instructions: instructions.map(instr => ({
      id: instr.id,
      category: instr.category,
      hasPreGenerated: SUPPORTED_LANGUAGES.reduce((acc, lang) => {
        acc[lang] = engine.hasPreGenerated(instr.id, lang);
        return acc;
      }, {} as Record<string, boolean>),
      translations: instr.translations,
    })),
  });
});

/**
 * GET /api/tts/manifest
 *
 * Get the full pre-generation manifest (all instruction + language combos).
 */
app.get('/api/tts/manifest', (_req: Request, res: Response) => {
  const manifest = engine.getPreGenerationManifest();
  res.json({
    totalEntries: manifest.length,
    languages: SUPPORTED_LANGUAGES,
    entries: manifest,
  });
});

/**
 * GET /api/tts/cache-stats
 *
 * Get cache performance statistics.
 */
app.get('/api/tts/cache-stats', (_req: Request, res: Response) => {
  res.json(cache.getStats());
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log('========================================================');
  console.log('           KisanMind TTS Service                        ');
  console.log('========================================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`);
  console.log(`Pre-generated files: ${engine.getAvailableFiles().length}`);
  console.log('========================================================\n');
});

export default app;
