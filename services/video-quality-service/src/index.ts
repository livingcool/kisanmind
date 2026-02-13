/**
 * Video Quality Service - Express Server
 *
 * Provides REST endpoints for real-time video frame quality analysis.
 *
 * Endpoints:
 *   POST /api/quality/analyze           - Analyze a single frame
 *   POST /api/quality/analyze-feedback  - Analyze frame + get feedback decision
 *   POST /api/quality/reset/:sessionId  - Reset feedback throttle for session
 *   GET  /health                        - Health check
 *
 * Port: 8300 (configurable via QUALITY_PORT env var)
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { getQualityAnalyzer } from './quality-analyzer.js';
import { getFeedbackMapper } from './feedback-mapper.js';

const app = express();
const PORT = process.env.QUALITY_PORT || 8300;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Frames can be large base64

// ---------------------------------------------------------------------------
// Service instances
// ---------------------------------------------------------------------------

const analyzer = getQualityAnalyzer();
const feedbackMapper = getFeedbackMapper();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * Health check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'video-quality-service',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/quality/analyze
 *
 * Analyze a single frame for quality metrics.
 *
 * Body: { imageData: string (base64), stepId?: string }
 * Response: QualityAnalysis
 */
app.post('/api/quality/analyze', async (req: Request, res: Response) => {
  try {
    const { imageData, stepId } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Missing required field: imageData' });
    }

    const analysis = await analyzer.analyzeFrame(imageData);

    res.json({
      ...analysis,
      stepId: stepId ?? null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Quality] Analysis error:', msg);
    res.status(500).json({ error: 'Frame analysis failed', message: msg });
  }
});

/**
 * POST /api/quality/analyze-feedback
 *
 * Analyze a frame AND determine the appropriate feedback action.
 * Includes feedback throttling to avoid spamming the user.
 *
 * Body: {
 *   imageData: string (base64),
 *   sessionId: string,
 *   stepId?: string
 * }
 *
 * Response: {
 *   analysis: QualityAnalysis,
 *   feedback: FeedbackDecision
 * }
 */
app.post('/api/quality/analyze-feedback', async (req: Request, res: Response) => {
  try {
    const { imageData, sessionId, stepId } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Missing required field: imageData' });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing required field: sessionId' });
    }

    const analysis = await analyzer.analyzeFrame(imageData);
    const feedback = feedbackMapper.mapToFeedback(sessionId, analysis);

    res.json({
      analysis: {
        ...analysis,
        stepId: stepId ?? null,
      },
      feedback,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Quality] Analyze-feedback error:', msg);
    res.status(500).json({ error: 'Frame analysis failed', message: msg });
  }
});

/**
 * POST /api/quality/reset/:sessionId
 *
 * Reset the feedback throttle state for a session.
 * Called when moving to a new capture step.
 */
app.post('/api/quality/reset/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  feedbackMapper.resetSession(sessionId);
  res.json({ status: 'ok', sessionId });
});

// ---------------------------------------------------------------------------
// Periodic cleanup
// ---------------------------------------------------------------------------

setInterval(() => {
  feedbackMapper.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log('========================================================');
  console.log('           KisanMind Video Quality Service              ');
  console.log('========================================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('========================================================\n');
});

export default app;
