/**
 * KisanMind Firebase Firestore Integration
 *
 * Provides persistent session storage using Firestore, replacing the in-memory Map.
 * Includes retry logic with exponential backoff and graceful fallback to in-memory
 * storage when Firebase is unavailable.
 *
 * Environment variables:
 *   FIREBASE_PROJECT_ID       - Firebase project ID
 *   FIREBASE_PRIVATE_KEY      - Service account private key
 *   FIREBASE_CLIENT_EMAIL     - Service account email
 *   FIREBASE_SERVICE_ACCOUNT_BASE64 - Alternative: base64-encoded service account JSON
 */

import admin from 'firebase-admin';
import type { Firestore, Timestamp } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Status values for individual agents within a session. */
export type AgentStatusValue = 'pending' | 'running' | 'completed' | 'error';

/** Status values for the overall session. */
export type SessionStatus = 'processing' | 'completed' | 'error';

/** A single agent's progress within a session. */
export interface AgentStatus {
  name: string;
  status: AgentStatusValue;
  progress: number;
  message: string;
}

/** The Firestore document shape for a session. */
export interface SessionDocument {
  sessionId: string;
  status: SessionStatus;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  expiresAt: Date | Timestamp;

  farmerInput: Record<string, unknown>;
  agentStatuses: AgentStatus[];

  synthesis?: Record<string, unknown>;
  error?: string;
}

/** The shape returned from getSession(), with Timestamps converted to Dates. */
export interface SessionData {
  sessionId: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;

  farmerInput: Record<string, unknown>;
  agentStatuses: AgentStatus[];

  /** Transformed synthesis report, present when status === 'completed' */
  report?: Record<string, unknown>;
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLLECTION = 'sessions';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/** Firestore error codes that are safe to retry. */
const RETRYABLE_CODES = new Set([
  'deadline-exceeded',
  'unavailable',
  'internal',
  'resource-exhausted',
]);

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let db: Firestore | null = null;
let firebaseInitialized = false;
let fallbackMode = false;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the Firebase Admin SDK and return a Firestore reference.
 * If initialization fails (missing credentials, network issues, etc.) the
 * module enters **fallback mode** and all subsequent operations return null
 * or silently succeed so the API server can continue with in-memory storage.
 */
export function initializeFirebase(): boolean {
  if (firebaseInitialized) {
    return !fallbackMode;
  }

  try {
    const credential = buildCredential();

    if (!credential) {
      console.warn('[Firebase] No credentials found -- entering fallback mode (in-memory storage)');
      fallbackMode = true;
      firebaseInitialized = true;
      return false;
    }

    // Avoid re-initializing if already initialized (e.g. hot reload)
    if (admin.apps.length === 0) {
      admin.initializeApp({ credential });
      console.log('[Firebase] Admin SDK initialized successfully');
    }

    db = admin.firestore();

    // Firestore settings -- ignore undefined fields so we can omit optional props
    db.settings({ ignoreUndefinedProperties: true });

    firebaseInitialized = true;
    fallbackMode = false;
    console.log('[Firebase] Firestore connected -- persistent storage enabled');
    return true;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error instanceof Error ? error.message : error);
    console.warn('[Firebase] Entering fallback mode (in-memory storage)');
    fallbackMode = true;
    firebaseInitialized = true;
    return false;
  }
}

/**
 * Build a Firebase credential from environment variables.
 * Returns null if no credentials are configured.
 */
function buildCredential(): admin.credential.Credential | null {
  // Option 1: Base64-encoded service account JSON
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    try {
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(json);
      console.log('[Firebase] Using base64-encoded service account');
      return admin.credential.cert(serviceAccount);
    } catch (err) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', err);
      return null;
    }
  }

  // Option 2: Individual env vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (projectId && privateKey && clientEmail) {
    console.log('[Firebase] Using individual credential env vars');
    return admin.credential.cert({
      projectId,
      // Private keys from env vars often have escaped newlines
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail,
    } as admin.ServiceAccount);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helper: Retry with exponential backoff
// ---------------------------------------------------------------------------

/**
 * Execute `fn` with up to `MAX_RETRIES` retries for transient Firestore errors.
 * Non-retryable errors (PERMISSION_DENIED, NOT_FOUND, INVALID_ARGUMENT) are
 * thrown immediately.
 */
async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      const code = extractFirestoreErrorCode(error);
      if (!code || !RETRYABLE_CODES.has(code)) {
        // Non-retryable -- propagate immediately
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(`[Firebase] ${label} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}, code=${code}), retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  throw lastError;
}

function extractFirestoreErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') return code;
    // Firestore numeric codes (e.g. 14 = UNAVAILABLE)
    if (typeof code === 'number') {
      const map: Record<number, string> = {
        4: 'deadline-exceeded',
        8: 'resource-exhausted',
        13: 'internal',
        14: 'unavailable',
      };
      return map[code] ?? null;
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public: query helpers
// ---------------------------------------------------------------------------

/** Returns true when Firebase is available; false when in fallback mode. */
export function isFirebaseAvailable(): boolean {
  return firebaseInitialized && !fallbackMode && db !== null;
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Create a new session document in Firestore.
 *
 * @returns true if written to Firestore, false if skipped (fallback mode).
 */
export async function createSession(
  sessionId: string,
  farmerInput: Record<string, unknown>,
  agentStatuses: AgentStatus[],
): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;

  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + SESSION_TTL_MS);

  const doc: SessionDocument = {
    sessionId,
    status: 'processing',
    createdAt: now,
    updatedAt: now,
    expiresAt,
    farmerInput,
    agentStatuses,
  };

  try {
    await withRetry(`createSession(${sessionId})`, () =>
      db!.collection(COLLECTION).doc(sessionId).set(doc),
    );
    console.log(`[Firebase] Session ${sessionId} created`);
    return true;
  } catch (error) {
    console.error(`[Firebase] Failed to create session ${sessionId}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Retrieve a session document from Firestore.
 *
 * @returns SessionData or null if the session does not exist or Firestore is unavailable.
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!isFirebaseAvailable()) return null;

  try {
    const snap = await withRetry(`getSession(${sessionId})`, () =>
      db!.collection(COLLECTION).doc(sessionId).get(),
    );

    if (!snap.exists) return null;

    const data = snap.data() as SessionDocument;
    return documentToSessionData(data);
  } catch (error) {
    console.error(`[Firebase] Failed to get session ${sessionId}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Update the overall session status and optionally other fields.
 */
export async function updateSessionStatus(
  sessionId: string,
  updates: Partial<Pick<SessionDocument, 'status' | 'error'>>,
): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;

  try {
    await withRetry(`updateSessionStatus(${sessionId})`, () =>
      db!.collection(COLLECTION).doc(sessionId).update({
        ...updates,
        updatedAt: admin.firestore.Timestamp.now(),
      }),
    );
    console.log(`[Firebase] Session ${sessionId} status updated to ${updates.status ?? '(unchanged)'}`);
    return true;
  } catch (error) {
    console.error(`[Firebase] Failed to update session status ${sessionId}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Replace the agentStatuses array on a session document.
 */
export async function updateAgentStatuses(
  sessionId: string,
  agentStatuses: AgentStatus[],
): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;

  try {
    await withRetry(`updateAgentStatuses(${sessionId})`, () =>
      db!.collection(COLLECTION).doc(sessionId).update({
        agentStatuses,
        updatedAt: admin.firestore.Timestamp.now(),
      }),
    );
    return true;
  } catch (error) {
    console.error(`[Firebase] Failed to update agent statuses ${sessionId}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Mark a session as completed and attach the synthesis report.
 */
export async function completeSession(
  sessionId: string,
  synthesis: Record<string, unknown>,
  agentStatuses?: AgentStatus[],
): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;

  const updatePayload: Record<string, unknown> = {
    status: 'completed' as SessionStatus,
    synthesis,
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (agentStatuses) {
    updatePayload.agentStatuses = agentStatuses;
  }

  try {
    await withRetry(`completeSession(${sessionId})`, () =>
      db!.collection(COLLECTION).doc(sessionId).update(updatePayload),
    );
    console.log(`[Firebase] Session ${sessionId} marked as completed`);
    return true;
  } catch (error) {
    console.error(`[Firebase] Failed to complete session ${sessionId}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Mark a session as failed and attach the error message.
 */
export async function errorSession(
  sessionId: string,
  errorMessage: string,
  agentStatuses?: AgentStatus[],
): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;

  const updatePayload: Record<string, unknown> = {
    status: 'error' as SessionStatus,
    error: errorMessage,
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (agentStatuses) {
    updatePayload.agentStatuses = agentStatuses;
  }

  try {
    await withRetry(`errorSession(${sessionId})`, () =>
      db!.collection(COLLECTION).doc(sessionId).update(updatePayload),
    );
    console.log(`[Firebase] Session ${sessionId} marked as error`);
    return true;
  } catch (error) {
    console.error(`[Firebase] Failed to mark session ${sessionId} as error:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Delete sessions that have passed their expiresAt timestamp.
 * Uses batch deletes (max 500 per batch per Firestore limits).
 *
 * @returns number of sessions deleted, or -1 on failure.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  if (!isFirebaseAvailable()) return -1;

  try {
    const now = admin.firestore.Timestamp.now();
    const query = db!
      .collection(COLLECTION)
      .where('expiresAt', '<', now)
      .limit(500);

    const snapshot = await withRetry('cleanupExpiredSessions:query', () => query.get());

    if (snapshot.empty) {
      console.log('[Firebase] Cleanup: no expired sessions found');
      return 0;
    }

    const batch = db!.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    await withRetry('cleanupExpiredSessions:batch', () => batch.commit());

    const count = snapshot.docs.length;
    console.log(`[Firebase] Cleanup: deleted ${count} expired session(s)`);
    return count;
  } catch (error) {
    console.error('[Firebase] Cleanup failed:', error instanceof Error ? error.message : error);
    return -1;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Firestore document (with Timestamps) to a plain SessionData object
 * (with Dates) suitable for the API layer.
 */
function documentToSessionData(doc: SessionDocument): SessionData {
  return {
    sessionId: doc.sessionId,
    status: doc.status,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
    expiresAt: toDate(doc.expiresAt),
    farmerInput: doc.farmerInput,
    agentStatuses: doc.agentStatuses ?? [],
    report: doc.synthesis ?? undefined,
    error: doc.error,
  };
}

/** Convert a Firestore Timestamp or Date to a plain Date. */
export function toDate(value: Date | Timestamp | unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  return new Date();
}

// ---------------------------------------------------------------------------
// Visual Assessment Storage
// ---------------------------------------------------------------------------

const VISUAL_ASSESSMENTS_COLLECTION = 'visualAssessments';
const VISUAL_ASSESSMENT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Visual assessment document stored in Firestore */
export interface VisualAssessmentDocument {
  id: string;
  sessionId: string;
  createdAt: Date | Timestamp;
  expiresAt: Date | Timestamp;

  // Soil analysis results
  soilAnalysis: any | null;
  soilImageCount: number;

  // Crop analysis results
  cropAnalysis: any | null;
  cropImageCount: number;

  // Metadata
  overallConfidence: number;
  analysisType: 'soil' | 'crop' | 'both';
  processingTime_ms: number;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Store a visual assessment in Firestore.
 */
export async function storeVisualAssessment(
  assessment: Omit<VisualAssessmentDocument, 'createdAt' | 'expiresAt'>
): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;

  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + VISUAL_ASSESSMENT_TTL_MS);

  const doc: VisualAssessmentDocument = {
    ...assessment,
    createdAt: now,
    expiresAt,
  };

  try {
    await withRetry(`storeVisualAssessment(${assessment.id})`, () =>
      db!.collection(VISUAL_ASSESSMENTS_COLLECTION).doc(assessment.id).set(doc),
    );
    console.log(`[Firebase] Visual assessment ${assessment.id} stored for session ${assessment.sessionId}`);
    return true;
  } catch (error) {
    console.error(`[Firebase] Failed to store visual assessment ${assessment.id}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Retrieve a visual assessment by ID.
 */
export async function getVisualAssessment(id: string): Promise<VisualAssessmentDocument | null> {
  if (!isFirebaseAvailable()) return null;

  try {
    const snap = await withRetry(`getVisualAssessment(${id})`, () =>
      db!.collection(VISUAL_ASSESSMENTS_COLLECTION).doc(id).get(),
    );

    if (!snap.exists) return null;

    const data = snap.data() as VisualAssessmentDocument;
    return {
      ...data,
      createdAt: toDate(data.createdAt),
      expiresAt: toDate(data.expiresAt),
    };
  } catch (error) {
    console.error(`[Firebase] Failed to get visual assessment ${id}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get all visual assessments for a session.
 */
export async function getSessionVisualAssessments(sessionId: string): Promise<VisualAssessmentDocument[]> {
  if (!isFirebaseAvailable()) return [];

  try {
    const snapshot = await withRetry(`getSessionVisualAssessments(${sessionId})`, () =>
      db!.collection(VISUAL_ASSESSMENTS_COLLECTION)
        .where('sessionId', '==', sessionId)
        .orderBy('createdAt', 'desc')
        .get(),
    );

    return snapshot.docs.map(doc => {
      const data = doc.data() as VisualAssessmentDocument;
      return {
        ...data,
        createdAt: toDate(data.createdAt),
        expiresAt: toDate(data.expiresAt),
      };
    });
  } catch (error) {
    console.error(`[Firebase] Failed to get visual assessments for session ${sessionId}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Get the latest visual assessment for a session.
 */
export async function getLatestVisualAssessment(sessionId: string): Promise<VisualAssessmentDocument | null> {
  if (!isFirebaseAvailable()) return null;

  try {
    const snapshot = await withRetry(`getLatestVisualAssessment(${sessionId})`, () =>
      db!.collection(VISUAL_ASSESSMENTS_COLLECTION)
        .where('sessionId', '==', sessionId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get(),
    );

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data() as VisualAssessmentDocument;
    return {
      ...data,
      createdAt: toDate(data.createdAt),
      expiresAt: toDate(data.expiresAt),
    };
  } catch (error) {
    console.error(`[Firebase] Failed to get latest visual assessment for session ${sessionId}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Delete expired visual assessments.
 */
export async function cleanupExpiredVisualAssessments(): Promise<number> {
  if (!isFirebaseAvailable()) return -1;

  try {
    const now = admin.firestore.Timestamp.now();
    const query = db!
      .collection(VISUAL_ASSESSMENTS_COLLECTION)
      .where('expiresAt', '<', now)
      .limit(500);

    const snapshot = await withRetry('cleanupExpiredVisualAssessments:query', () => query.get());

    if (snapshot.empty) {
      console.log('[Firebase] Cleanup: no expired visual assessments found');
      return 0;
    }

    const batch = db!.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    await withRetry('cleanupExpiredVisualAssessments:batch', () => batch.commit());

    const count = snapshot.docs.length;
    console.log(`[Firebase] Cleanup: deleted ${count} expired visual assessment(s)`);
    return count;
  } catch (error) {
    console.error('[Firebase] Visual assessment cleanup failed:', error instanceof Error ? error.message : error);
    return -1;
  }
}
