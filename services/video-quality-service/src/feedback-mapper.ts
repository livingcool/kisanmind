/**
 * Feedback Mapper
 *
 * Maps quality analysis results to actionable feedback for the farmer.
 * Integrates with the TTS service instruction IDs and handles
 * feedback throttling to avoid overwhelming the user with rapid audio.
 */

import { type QualityAnalysis, type QualityIssue } from './quality-analyzer.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedbackDecision {
  /** Whether to send audio feedback for this frame */
  shouldSpeak: boolean;
  /** TTS instruction ID to play */
  instructionId: string;
  /** Visual feedback color */
  overlayColor: 'green' | 'yellow' | 'red';
  /** Short status text */
  statusText: string;
  /** Whether the capture button should be enabled */
  captureEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Feedback throttling
// ---------------------------------------------------------------------------

interface ThrottleState {
  lastFeedbackTime: number;
  lastFeedbackId: string;
  consecutiveGoodFrames: number;
  consecutiveBadFrames: number;
  lastIssue: QualityIssue;
}

// Minimum time between audio feedback (milliseconds)
const MIN_FEEDBACK_INTERVAL = 3000;

// Number of consecutive good frames before announcing "quality_good"
const GOOD_FRAMES_THRESHOLD = 3;

// Number of consecutive bad frames before repeating feedback
const BAD_FRAMES_THRESHOLD = 5;

// ---------------------------------------------------------------------------
// Feedback Mapper
// ---------------------------------------------------------------------------

export class FeedbackMapper {
  private sessions: Map<string, ThrottleState> = new Map();

  /**
   * Get or create throttle state for a session.
   */
  private getState(sessionId: string): ThrottleState {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        lastFeedbackTime: 0,
        lastFeedbackId: '',
        consecutiveGoodFrames: 0,
        consecutiveBadFrames: 0,
        lastIssue: 'good',
      });
    }
    return this.sessions.get(sessionId)!;
  }

  /**
   * Map a quality analysis result to a feedback decision.
   *
   * Applies throttling to prevent spamming the user with rapid audio.
   * Only triggers audio when:
   * 1. Enough time has passed since last feedback
   * 2. The issue has changed
   * 3. Enough consecutive good/bad frames for confirmation
   */
  mapToFeedback(sessionId: string, analysis: QualityAnalysis): FeedbackDecision {
    const state = this.getState(sessionId);
    const now = Date.now();
    const timeSinceLastFeedback = now - state.lastFeedbackTime;

    // Track consecutive frames
    if (analysis.primaryIssue === 'good') {
      state.consecutiveGoodFrames++;
      state.consecutiveBadFrames = 0;
    } else {
      state.consecutiveBadFrames++;
      state.consecutiveGoodFrames = 0;
    }

    // Determine overlay color
    let overlayColor: FeedbackDecision['overlayColor'];
    if (analysis.score >= 80) {
      overlayColor = 'green';
    } else if (analysis.score >= 50) {
      overlayColor = 'yellow';
    } else {
      overlayColor = 'red';
    }

    // Determine status text
    const statusTexts: Record<QualityIssue, string> = {
      good: analysis.score >= 80 ? 'Ready to capture' : 'Acceptable quality',
      blur: 'Hold phone steady',
      dark: 'Too dark - find better light',
      bright: 'Too bright - move to shade',
      far: 'Move closer',
      close: 'Move further back',
    };

    const statusText = statusTexts[analysis.primaryIssue];
    const captureEnabled = analysis.isAcceptable;

    // Determine whether to speak
    let shouldSpeak = false;
    let instructionId = analysis.feedbackId;

    // Rule 1: Issue changed from last time
    const issueChanged = analysis.primaryIssue !== state.lastIssue;

    // Rule 2: Enough time has elapsed
    const enoughTimeElapsed = timeSinceLastFeedback >= MIN_FEEDBACK_INTERVAL;

    // Rule 3: Good quality confirmed (multiple frames)
    const goodConfirmed =
      analysis.primaryIssue === 'good' &&
      state.consecutiveGoodFrames === GOOD_FRAMES_THRESHOLD;

    // Rule 4: Bad quality persistent (repeated frames)
    const badPersistent =
      analysis.primaryIssue !== 'good' &&
      state.consecutiveBadFrames >= BAD_FRAMES_THRESHOLD &&
      state.consecutiveBadFrames % BAD_FRAMES_THRESHOLD === 0;

    if (enoughTimeElapsed) {
      if (issueChanged) {
        shouldSpeak = true;
      } else if (goodConfirmed) {
        shouldSpeak = true;
        instructionId = 'quality_good';
      } else if (badPersistent) {
        shouldSpeak = true;
      }
    }

    // Update state
    if (shouldSpeak) {
      state.lastFeedbackTime = now;
      state.lastFeedbackId = instructionId;
    }
    state.lastIssue = analysis.primaryIssue;

    return {
      shouldSpeak,
      instructionId,
      overlayColor,
      statusText,
      captureEnabled,
    };
  }

  /**
   * Reset throttle state for a session (e.g., when moving to next step).
   */
  resetSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Clean up old sessions.
   */
  cleanup(maxAge: number = 30 * 60 * 1000): void {
    const now = Date.now();
    for (const [sessionId, state] of this.sessions) {
      if (now - state.lastFeedbackTime > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Singleton
let mapperInstance: FeedbackMapper | null = null;

export function getFeedbackMapper(): FeedbackMapper {
  if (!mapperInstance) {
    mapperInstance = new FeedbackMapper();
  }
  return mapperInstance;
}
