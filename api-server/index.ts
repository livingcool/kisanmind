/**
 * KisanMind API Server
 *
 * Express API server that bridges the frontend and orchestrator.
 * Provides REST endpoints for the Next.js frontend to submit farmer inputs
 * and retrieve farming recommendations.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Dynamic import of orchestrator at runtime to avoid TypeScript resolution issues
let createOrchestrator: any;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for session results (in production, use Redis or DB)
const sessions = new Map<string, {
  status: 'processing' | 'completed' | 'error';
  report?: any;
  error?: string;
  createdAt: Date;
}>();

/**
 * Initialize orchestrator module
 */
async function initOrchestrator() {
  try {
    // @ts-ignore - Dynamic import resolved at runtime
    const module = await import('../../orchestrator/dist/index.js');
    createOrchestrator = module.createOrchestrator;
    console.log('[API] Orchestrator module loaded successfully');
  } catch (error) {
    console.error('[API] Failed to load orchestrator:', error);
    throw error;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    orchestrator: createOrchestrator ? 'ready' : 'loading',
  });
});

/**
 * Submit farmer input and start analysis
 * POST /api/farming-plan
 */
app.post('/api/farming-plan', async (req: Request, res: Response) => {
  try {
    const farmerInput = req.body;

    // Generate session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize session
    sessions.set(sessionId, {
      status: 'processing',
      createdAt: new Date(),
    });

    // Start processing in background
    processfarmerInput(sessionId, farmerInput);

    // Return session ID immediately
    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating farming plan:', error);
    res.status(500).json({
      error: 'Failed to submit farmer input',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get farming plan status and results
 * GET /api/farming-plan/:sessionId
 */
app.get('/api/farming-plan/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'Session not found',
      sessionId,
    });
  }

  if (session.status === 'processing') {
    return res.json({
      sessionId,
      status: 'processing',
      message: 'AI agents are analyzing your farm data...',
    });
  }

  if (session.status === 'error') {
    return res.status(500).json({
      sessionId,
      status: 'error',
      error: session.error || 'Processing failed',
    });
  }

  // Return completed report
  res.json({
    sessionId,
    status: 'completed',
    report: session.report,
  });
});

/**
 * Background processing function
 * Converts frontend format to orchestrator format and processes
 */
async function processfarmerInput(sessionId: string, input: any) {
  try {
    if (!createOrchestrator) {
      throw new Error('Orchestrator not initialized');
    }

    // Convert frontend input format to orchestrator text format
    const inputText = buildInputText(input);

    console.log(`[API] Processing session ${sessionId}`);
    console.log(`[API] Input:`, inputText);

    // Create orchestrator with progress callback
    const orchestrator = createOrchestrator((stage: string, message: string) => {
      console.log(`[API] [${sessionId}] ${stage}: ${message}`);
    });

    // Process the input
    const result = await orchestrator.processWithMeta(inputText);

    // Store the result
    sessions.set(sessionId, {
      status: 'completed',
      report: result.report,
      createdAt: sessions.get(sessionId)!.createdAt,
    });

    console.log(`[API] Session ${sessionId} completed successfully`);
  } catch (error) {
    console.error(`[API] Error processing session ${sessionId}:`, error);

    sessions.set(sessionId, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Processing failed',
      createdAt: sessions.get(sessionId)!.createdAt,
    });
  }
}

/**
 * Convert frontend structured input to natural language text for orchestrator
 */
function buildInputText(input: any): string {
  const parts: string[] = [];

  // Location
  if (input.location?.address) {
    parts.push(`I am a farmer from ${input.location.address}.`);
  } else if (input.location?.coordinates) {
    parts.push(
      `I am a farmer at coordinates ${input.location.coordinates.lat}, ${input.location.coordinates.lon}.`
    );
  }

  // Land size
  if (input.landSize) {
    parts.push(`I have ${input.landSize} acres of land.`);
  }

  // Water source
  if (input.waterSource) {
    const sourceMap: Record<string, string> = {
      borewell: 'borewell water',
      well: 'open well water',
      canal: 'canal irrigation',
      river: 'river water',
      rainwater: 'only rainwater (rainfed)',
      pond: 'pond water',
    };
    parts.push(`My water source is ${sourceMap[input.waterSource] || input.waterSource}.`);
  }

  // Previous crops
  if (input.previousCrops && input.previousCrops.length > 0) {
    parts.push(`I previously grew ${input.previousCrops.join(', ')}.`);
  }

  // Budget
  if (input.budget) {
    parts.push(`My budget is around ${input.budget} rupees.`);
  }

  // Additional notes
  if (input.notes) {
    parts.push(input.notes);
  }

  // Fallback if no input
  if (parts.length === 0) {
    return 'I am a farmer looking for crop recommendations.';
  }

  return parts.join(' ');
}

/**
 * Cleanup old sessions (run periodically)
 */
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt.getTime() > oneHour) {
      sessions.delete(sessionId);
      console.log(`[API] Cleaned up old session: ${sessionId}`);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

// Initialize and start server
(async () => {
  try {
    console.log('[API] Initializing...');
    await initOrchestrator();

    app.listen(PORT, () => {
      console.log('========================================================');
      console.log('           KisanMind API Server                         ');
      console.log('========================================================');
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('Ready to serve farming recommendations!');
      console.log('========================================================\n');
    });
  } catch (error) {
    console.error('[API] Fatal error during initialization:', error);
    process.exit(1);
  }
})();

export default app;
