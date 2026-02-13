/**
 * KisanMind API Server
 *
 * Express API server that bridges the frontend and orchestrator.
 * Provides REST endpoints for the Next.js frontend to submit farmer inputs
 * and retrieve farming recommendations.
 *
 * Storage strategy:
 *   - Primary:  Firestore (persistent across restarts)
 *   - Fallback: In-memory Map (used when Firebase is unavailable)
 *
 * The server initialises Firebase at startup. If credentials are missing or
 * Firebase is unreachable, the server falls back to in-memory storage and
 * continues to operate normally.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeFirebase,
  isFirebaseAvailable,
  createSession as fbCreateSession,
  getSession as fbGetSession,
  updateAgentStatuses as fbUpdateAgentStatuses,
  completeSession as fbCompleteSession,
  errorSession as fbErrorSession,
  cleanupExpiredSessions as fbCleanupExpiredSessions,
  type AgentStatus,
  type SessionStatus,
} from './firebase.js';
import { visualAssessmentRouter } from './visual-assessment-routes.js';
import { cleanupOldAssessments, getLatestAssessment, toVisualIntelligence } from './visual-assessment-db.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import of orchestrator at runtime to avoid TypeScript resolution issues
let createOrchestrator: any;

// Load environment variables from parent directory
// In dev mode (tsx): __dirname is api-server/, so use ../.env
// In production (node dist/): __dirname is api-server/dist/, so use ../../.env
const envPath = __dirname.includes('dist')
  ? path.resolve(__dirname, '../../.env')
  : path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // In production, allow production URL and all Vercel preview URLs
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      /https:\/\/.*\.vercel\.app$/, // Allow all Vercel preview deployments
    ];

    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Visual assessment routes (image upload for soil/crop analysis)
app.use('/api/visual-assessment', visualAssessmentRouter);

// ---------------------------------------------------------------------------
// In-memory fallback storage
// ---------------------------------------------------------------------------

interface InMemorySession {
  status: SessionStatus;
  report?: any;
  error?: string;
  createdAt: Date;
  agentStatuses?: AgentStatus[];
}

/**
 * Fallback in-memory Map used when Firebase is unavailable.
 * Also serves as a fast local cache for the current instance so that
 * progress-callback updates (which fire frequently) avoid extra Firestore
 * writes for GET polling.
 */
const sessions = new Map<string, InMemorySession>();

// ---------------------------------------------------------------------------
// Helpers: dual-mode read / write
// ---------------------------------------------------------------------------

/**
 * Write session to both Firestore (if available) and the local Map.
 * Firestore failures are logged but do not block the server.
 */
async function storeSession(
  sessionId: string,
  data: InMemorySession,
  farmerInput?: Record<string, unknown>,
): Promise<void> {
  // Always update in-memory
  sessions.set(sessionId, data);

  // Persist to Firestore (best effort)
  if (isFirebaseAvailable() && farmerInput) {
    await fbCreateSession(sessionId, farmerInput, data.agentStatuses ?? []);
  }
}

/**
 * Retrieve session data. Checks in-memory first, then falls back to
 * Firestore so that sessions survive server restarts.
 */
async function loadSession(sessionId: string): Promise<InMemorySession | null> {
  // Check in-memory first (fastest path)
  const local = sessions.get(sessionId);
  if (local) return local;

  // Check Firestore (handles server restart scenario)
  if (isFirebaseAvailable()) {
    const fbSession = await fbGetSession(sessionId);
    if (fbSession) {
      // Hydrate local cache for subsequent reads
      const local: InMemorySession = {
        status: fbSession.status,
        report: fbSession.report,
        error: fbSession.error,
        createdAt: fbSession.createdAt,
        agentStatuses: fbSession.agentStatuses,
      };
      sessions.set(sessionId, local);
      return local;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Initialize orchestrator module
// ---------------------------------------------------------------------------

async function initOrchestrator() {
  try {
    // @ts-ignore - Dynamic import resolved at runtime
    const module = await import('../orchestrator/dist/index.js');
    createOrchestrator = module.createOrchestrator;
    console.log('[API] Orchestrator module loaded successfully');
  } catch (error) {
    console.error('[API] Failed to load orchestrator:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    orchestrator: createOrchestrator ? 'ready' : 'loading',
    storage: isFirebaseAvailable() ? 'firestore' : 'in-memory',
  });
});

/**
 * Submit farmer input and start analysis
 * POST /api/farming-plan
 */
app.post('/api/farming-plan', async (req: Request, res: Response) => {
  try {
    const farmerInput = req.body;
    const visualAssessmentId: string | undefined = req.body.visualAssessmentId;

    // Generate session ID (or use existing if visual assessment was done first)
    const sessionId = req.body.sessionId
      || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if visual assessment data is available for this session
    const latestVisualCheck = await getLatestAssessment(sessionId);
    const hasVisualData = !!visualAssessmentId || !!latestVisualCheck;

    const initialAgentStatuses: AgentStatus[] = [
      { name: 'Ground Analyzer', status: 'running', progress: 10, message: 'Analyzing soil conditions...' },
      { name: 'Water Assessor', status: 'running', progress: 10, message: 'Checking water quality...' },
      { name: 'Climate Forecaster', status: 'running', progress: 10, message: 'Fetching weather data...' },
      { name: 'Market Intel', status: 'running', progress: 10, message: 'Analyzing market prices...' },
      { name: 'Scheme Finder', status: 'running', progress: 10, message: 'Finding government schemes...' },
    ];

    // Add Visual Analyzer agent status if visual data is available
    if (hasVisualData) {
      initialAgentStatuses.push({
        name: 'Visual Analyzer',
        status: 'completed',
        progress: 100,
        message: 'Image analysis complete',
      });
    }

    // Store session in both Firestore and in-memory
    await storeSession(
      sessionId,
      {
        status: 'processing',
        createdAt: new Date(),
        agentStatuses: initialAgentStatuses,
      },
      farmerInput,
    );

    // Start processing in background
    processfarmerInput(sessionId, farmerInput);

    // Return session ID immediately
    res.json({ sessionId, hasVisualData });
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
app.get('/api/farming-plan/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = await loadSession(sessionId);

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
      agentStatuses: session.agentStatuses || [],
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

  // Return completed report (already transformed when stored)
  res.json({
    sessionId,
    status: 'completed',
    agentStatuses: session.agentStatuses?.map(agent => ({
      ...agent,
      status: 'completed' as const,
      progress: 100,
    })) || [],
    synthesis: session.report,
  });
});

// ---------------------------------------------------------------------------
// Report transformation
// ---------------------------------------------------------------------------

/**
 * Transform orchestrator report format to frontend synthesis format
 */
function transformOrchestratorReport(orchestratorReport: any): any {
  if (!orchestratorReport) {
    console.log('[API] transformOrchestratorReport: orchestratorReport is null/undefined');
    return null;
  }

  console.log('[API] transformOrchestratorReport: Transforming FarmingDecisionReport to frontend synthesis format');

  // Transform from FarmingDecisionReport to frontend synthesis format
  const synthesis = {
    recommendedCrop: {
      name: orchestratorReport.primaryRecommendation?.crop || 'Not specified',
      variety: orchestratorReport.primaryRecommendation?.variety || 'Not specified',
      profitEstimate: orchestratorReport.primaryRecommendation?.expectedProfit_per_acre || 0,
      costEstimate: orchestratorReport.primaryRecommendation?.costEstimate_per_acre || 0,
    },
    sowingDetails: {
      sowingDate: orchestratorReport.primaryRecommendation?.sowingDate || 'Not specified',
      spacing: orchestratorReport.primaryRecommendation?.spacing || 'Standard spacing recommended',
      seedRate: orchestratorReport.primaryRecommendation?.seedRate || 'As per local recommendations',
      soilPreparation: orchestratorReport.primaryRecommendation?.soilPreparation || 'Prepare soil as per standard practices',
    },
    waterManagement: {
      irrigationSchedule: orchestratorReport.waterStrategy?.waterSchedule || 'As needed',
      waterRequirement: orchestratorReport.waterStrategy?.totalWaterRequirement || 'Standard requirements',
      recommendations: orchestratorReport.waterStrategy?.waterSavingTips || [],
    },
    sellingStrategy: {
      bestSellingTime: orchestratorReport.marketStrategy?.bestSellingTime || 'Post-harvest',
      expectedPrice: orchestratorReport.marketStrategy?.expectedPrice || 0,
      nearbyMandis: orchestratorReport.marketStrategy?.nearbyMandis || [],
    },
    governmentSchemes: (orchestratorReport.governmentSupport?.schemesToApply || []).map((scheme: any) => ({
      name: scheme.name,
      description: scheme.benefit,
      eligibility: scheme.eligibility || 'Check with local office',
      benefit: scheme.benefit,
      applicationLink: scheme.howToApply || undefined,
    })),
    riskWarnings: (orchestratorReport.riskAssessment || []).map((risk: any) => ({
      risk: risk.risk,
      severity: risk.severity,
      mitigation: risk.mitigation,
    })),
    actionPlan: (orchestratorReport.monthlyActionPlan || []).map((plan: any) => ({
      month: plan.month,
      activities: plan.actions,
    })),
  };

  console.log('[API] transformOrchestratorReport: Transformation complete');
  return synthesis;
}

// ---------------------------------------------------------------------------
// Background processing
// ---------------------------------------------------------------------------

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

    // Track whether we need to persist agent status changes to Firestore.
    // We throttle Firestore writes to avoid excessive updates during rapid
    // progress callbacks.
    let lastFirestoreSync = 0;
    const FIRESTORE_SYNC_INTERVAL_MS = 2000; // sync at most every 2 s

    // Create orchestrator with progress callback
    const orchestrator = createOrchestrator((stage: string, message: string) => {
      console.log(`[API] [${sessionId}] ${stage}: ${message}`);

      // Update agent statuses based on orchestrator events
      const session = sessions.get(sessionId);
      if (!session || !session.agentStatuses) return;

      // Map stages to agent updates
      if (stage.includes('soil')) {
        const idx = session.agentStatuses.findIndex(a => a.name === 'Ground Analyzer');
        if (idx >= 0) {
          session.agentStatuses[idx] = {
            ...session.agentStatuses[idx],
            status: stage.includes('done') ? 'completed' : 'running',
            progress: stage.includes('done') ? 100 : 50,
            message: stage.includes('done') ? 'Soil analysis complete' : 'Analyzing soil...',
          };
        }
      } else if (stage.includes('water')) {
        const idx = session.agentStatuses.findIndex(a => a.name === 'Water Assessor');
        if (idx >= 0) {
          session.agentStatuses[idx] = {
            ...session.agentStatuses[idx],
            status: stage.includes('done') ? 'completed' : 'running',
            progress: stage.includes('done') ? 100 : 50,
            message: stage.includes('done') ? 'Water assessment complete' : 'Assessing water...',
          };
        }
      } else if (stage.includes('climate')) {
        const idx = session.agentStatuses.findIndex(a => a.name === 'Climate Forecaster');
        if (idx >= 0) {
          session.agentStatuses[idx] = {
            ...session.agentStatuses[idx],
            status: stage.includes('done') ? 'completed' : 'running',
            progress: stage.includes('done') ? 100 : 50,
            message: stage.includes('done') ? 'Climate forecast complete' : 'Forecasting climate...',
          };
        }
      } else if (stage.includes('market')) {
        const idx = session.agentStatuses.findIndex(a => a.name === 'Market Intel');
        if (idx >= 0) {
          session.agentStatuses[idx] = {
            ...session.agentStatuses[idx],
            status: stage.includes('done') ? 'completed' : 'running',
            progress: stage.includes('done') ? 100 : 50,
            message: stage.includes('done') ? 'Market analysis complete' : 'Analyzing markets...',
          };
        }
      } else if (stage.includes('scheme')) {
        const idx = session.agentStatuses.findIndex(a => a.name === 'Scheme Finder');
        if (idx >= 0) {
          session.agentStatuses[idx] = {
            ...session.agentStatuses[idx],
            status: stage.includes('done') ? 'completed' : 'running',
            progress: stage.includes('done') ? 100 : 50,
            message: stage.includes('done') ? 'Schemes found' : 'Finding schemes...',
          };
        }
      } else if (stage.includes('synthesis')) {
        // All agents complete, synthesis starting
        session.agentStatuses.forEach((agent, idx) => {
          session.agentStatuses![idx] = { ...agent, status: 'completed', progress: 100 };
        });
      }

      // Update in-memory (synchronous, always)
      sessions.set(sessionId, session);

      // Throttled Firestore sync for agent progress updates
      const now = Date.now();
      if (isFirebaseAvailable() && now - lastFirestoreSync > FIRESTORE_SYNC_INTERVAL_MS) {
        lastFirestoreSync = now;
        // Fire-and-forget -- do not await in synchronous callback
        fbUpdateAgentStatuses(sessionId, session.agentStatuses).catch(err => {
          console.warn(`[Firebase] Throttled agent status sync failed for ${sessionId}:`, err);
        });
      }
    });

    // Check for visual assessment data for this session
    const latestVisual = await getLatestAssessment(sessionId);
    const visualIntelligence = latestVisual ? toVisualIntelligence(latestVisual) : null;
    if (visualIntelligence) {
      console.log(`[API] Visual intelligence available for session ${sessionId}: soil=${visualIntelligence.hasSoilData}, crop=${visualIntelligence.hasCropData}, confidence=${visualIntelligence.overallConfidence}`);
    }

    // Process the input with optional visual intelligence
    const result = await orchestrator.processWithMeta(inputText, {
      visualIntelligence,
    });

    // Transform orchestrator format to frontend format
    const transformedReport = transformOrchestratorReport(result.report);

    // Store the result in-memory
    const existingSession = sessions.get(sessionId)!;
    sessions.set(sessionId, {
      status: 'completed',
      report: transformedReport,
      createdAt: existingSession.createdAt,
      agentStatuses: existingSession.agentStatuses,
    });

    // Persist completed session to Firestore
    if (isFirebaseAvailable()) {
      await fbCompleteSession(
        sessionId,
        transformedReport ?? {},
        existingSession.agentStatuses,
      );
    }

    console.log(`[API] Session ${sessionId} completed successfully`);
  } catch (error) {
    console.error(`[API] Error processing session ${sessionId}:`, error);

    const existingSession = sessions.get(sessionId);
    const errorMessage = error instanceof Error ? error.message : 'Processing failed';
    const failedAgentStatuses = existingSession?.agentStatuses?.map(agent => ({
      ...agent,
      status: 'error' as const,
      message: 'Processing failed',
    }));

    sessions.set(sessionId, {
      status: 'error',
      error: errorMessage,
      createdAt: existingSession?.createdAt ?? new Date(),
      agentStatuses: failedAgentStatuses,
    });

    // Persist error to Firestore
    if (isFirebaseAvailable()) {
      await fbErrorSession(sessionId, errorMessage, failedAgentStatuses);
    }
  }
}

// ---------------------------------------------------------------------------
// Input text builder
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Periodic cleanup
// ---------------------------------------------------------------------------

/**
 * Cleanup old sessions every 10 minutes.
 * Deletes from both in-memory Map (1 hour TTL) and Firestore (30 day TTL).
 */
setInterval(async () => {
  // --- In-memory cleanup (1 hour TTL to keep memory bounded) ---
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt.getTime() > oneHour) {
      sessions.delete(sessionId);
      console.log(`[API] Cleaned up old in-memory session: ${sessionId}`);
    }
  }

  // --- Visual assessment cleanup (1 hour TTL) ---
  cleanupOldAssessments();

  // --- Firestore cleanup (30 day TTL via expiresAt field) ---
  if (isFirebaseAvailable()) {
    try {
      await fbCleanupExpiredSessions();
    } catch (err) {
      console.error('[API] Firestore cleanup error:', err);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

// ---------------------------------------------------------------------------
// Initialize and start server
// ---------------------------------------------------------------------------

(async () => {
  try {
    console.log('[API] Initializing...');

    // Initialize Firebase (non-blocking -- fallback mode on failure)
    const firebaseReady = initializeFirebase();
    if (firebaseReady) {
      console.log('[API] Firebase Firestore enabled for persistent session storage');
    } else {
      console.log('[API] Firebase unavailable -- using in-memory session storage');
    }

    await initOrchestrator();

    app.listen(PORT, () => {
      console.log('========================================================');
      console.log('           KisanMind API Server                         ');
      console.log('========================================================');
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Storage mode: ${isFirebaseAvailable() ? 'Firestore (persistent)' : 'In-memory (fallback)'}`);
      console.log('Ready to serve farming recommendations!');
      console.log('========================================================\n');
    });
  } catch (error) {
    console.error('[API] Fatal error during initialization:', error);
    process.exit(1);
  }
})();

export default app;
