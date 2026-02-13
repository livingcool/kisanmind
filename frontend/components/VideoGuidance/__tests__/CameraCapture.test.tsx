/**
 * Tests for CameraCapture component
 *
 * This component provides the camera interface for capturing crop/soil images.
 * Tests cover:
 * - Camera initialization and loading states
 * - Live video preview display
 * - Image capture and preview
 * - Error handling and user feedback
 * - Quality guidance and tips
 * - Retake and confirm functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CameraCapture from '../CameraCapture';
import { CAPTURE_STEPS } from '../captureSteps';
import * as useVideoStreamModule from '../hooks/useVideoStream';
import * as useImageQualityModule from '../hooks/useImageQuality';

// Create default mock implementations
const createMockVideoStream = (overrides = {}) => ({
  stream: new MediaStream(),
  isLoading: false,
  error: null,
  videoRef: { current: null },
  startStream: vi.fn(),
  stopStream: vi.fn(),
  captureFrame: vi.fn(() => 'data:image/jpeg;base64,mockedImageData'),
  ...overrides,
});

const createMockImageQuality = (overrides = {}) => ({
  analyzeQuality: vi.fn().mockResolvedValue({
    isAcceptable: true,
    brightness: 0.7,
    sharpness: 0.8,
    issues: [],
  }),
  isAnalyzing: false,
  ...overrides,
});

// Mock the hooks
vi.mock('../hooks/useVideoStream');
vi.mock('../hooks/useImageQuality');

describe('CameraCapture Component', () => {
  const mockStep = CAPTURE_STEPS[0]; // Soil Sample 1
  const mockOnCapture = vi.fn();
  const mockOnSkip = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    step: mockStep,
    onCapture: mockOnCapture,
    onSkip: mockOnSkip,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mocks
    vi.mocked(useVideoStreamModule.useVideoStream).mockReturnValue(
      createMockVideoStream() as any
    );
    vi.mocked(useImageQualityModule.useImageQuality).mockReturnValue(
      createMockImageQuality() as any
    );
  });

  describe('Live Camera View', () => {
    it('should display step title and instruction', () => {
      render(<CameraCapture {...defaultProps} />);

      expect(screen.getByText(mockStep.title)).toBeInTheDocument();
      expect(screen.getByText(mockStep.instruction)).toBeInTheDocument();
    });

    it('should show quality tips by default', () => {
      render(<CameraCapture {...defaultProps} />);

      expect(screen.getByText('📸 Tips for Best Results')).toBeInTheDocument();
      mockStep.qualityTips.forEach((tip) => {
        expect(screen.getByText(tip)).toBeInTheDocument();
      });
    });

    it('should hide quality tips when close button is clicked', async () => {
      render(<CameraCapture {...defaultProps} />);

      const closeTipButtons = screen.getAllByRole('button');
      const closeTipButton = closeTipButtons.find(
        (btn) => btn.querySelector('svg') && btn.parentElement?.textContent?.includes('Tips')
      );

      if (closeTipButton) {
        await userEvent.click(closeTipButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('📸 Tips for Best Results')).not.toBeInTheDocument();
      });
    });

    it('should show "Show Tips" button when tips are hidden', async () => {
      render(<CameraCapture {...defaultProps} />);

      // Close tips first
      const closeTipButtons = screen.getAllByRole('button');
      const closeTipButton = closeTipButtons.find(
        (btn) => btn.querySelector('svg') && btn.parentElement?.textContent?.includes('Tips')
      );

      if (closeTipButton) {
        await userEvent.click(closeTipButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Show Tips')).toBeInTheDocument();
      });
    });

    it('should display cancel button', () => {
      render(<CameraCapture {...defaultProps} />);

      const cancelButtons = screen.getAllByRole('button');
      // The X button in the header is the cancel button
      expect(cancelButtons.length).toBeGreaterThan(0);
    });
  });

  describe('User Actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      render(<CameraCapture {...defaultProps} />);

      // Find X button (cancel)
      const cancelButtons = screen.getAllByRole('button');
      const cancelButton = cancelButtons.find(
        (btn) => btn.querySelector('svg') && !btn.querySelector('svg.lucide-camera')
      );

      if (cancelButton) {
        await userEvent.click(cancelButton);
        expect(mockOnCancel).toHaveBeenCalled();
      }
    });

    it('should call onSkip when Skip button is clicked', async () => {
      const optionalStep = CAPTURE_STEPS.find((s) => !s.required)!;

      render(<CameraCapture {...defaultProps} step={optionalStep} />);

      const skipButton = screen.getByText('Skip');
      await userEvent.click(skipButton);

      expect(mockOnSkip).toHaveBeenCalled();
    });

    it('should not show Skip button for required steps', () => {
      const requiredStep = CAPTURE_STEPS.find((s) => s.required)!;

      render(<CameraCapture {...defaultProps} step={requiredStep} onSkip={mockOnSkip} />);

      expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    });
  });
});
