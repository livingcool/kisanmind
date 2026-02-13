/**
 * Tests for useVideoStream hook
 *
 * This hook manages camera video streams for the visual assessment feature.
 * Tests cover:
 * - Camera initialization and stream acquisition
 * - Permission handling and error states
 * - Video element synchronization
 * - Stream cleanup and resource management
 * - Frame capture functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVideoStream } from '../useVideoStream';

describe('useVideoStream Hook', () => {
  // Mock media stream
  let mockStream: MediaStream;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a fresh mock stream for each test
    mockStream = new MediaStream();

    // Mock successful getUserMedia by default
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream);
  });

  afterEach(() => {
    // Clean up any active streams
    if (mockStream) {
      mockStream.getTracks().forEach((track) => track.stop());
    }
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useVideoStream());

      expect(result.current.stream).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasPermission).toBe(false);
    });

    it('should provide videoRef for element attachment', () => {
      const { result } = renderHook(() => useVideoStream());

      expect(result.current.videoRef).toBeDefined();
      expect(result.current.videoRef.current).toBeNull(); // Not attached yet
    });
  });

  describe('Camera Initialization', () => {
    it('should successfully start video stream with default options', async () => {
      const { result } = renderHook(() => useVideoStream());

      await act(async () => {
        await result.current.startStream();
      });

      // Should request camera with correct constraints
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment', // Default rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      // Should update state correctly
      expect(result.current.stream).toBe(mockStream);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasPermission).toBe(true);
    });

    it('should request front camera when specified', async () => {
      const { result } = renderHook(() =>
        useVideoStream({ preferredCamera: 'user' })
      );

      await act(async () => {
        await result.current.startStream();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            facingMode: 'user',
          }),
        })
      );
    });

    it('should use custom resolution when provided', async () => {
      const { result } = renderHook(() =>
        useVideoStream({ width: 1920, height: 1080 })
      );

      await act(async () => {
        await result.current.startStream();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }),
        })
      );
    });

    it('should show loading state during stream initialization', async () => {
      const { result } = renderHook(() => useVideoStream());

      // Start stream but don't await
      const startPromise = act(async () => {
        await result.current.startStream();
      });

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      await startPromise;

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
    });

    it('should attach stream to video element when ref is set', async () => {
      const { result } = renderHook(() => useVideoStream());

      // Create a mock video element
      const mockVideoElement = document.createElement('video');
      const playSpy = vi.spyOn(mockVideoElement, 'play');

      // Attach the ref
      act(() => {
        result.current.videoRef.current = mockVideoElement;
      });

      await act(async () => {
        await result.current.startStream();
      });

      // Video element should have stream attached
      expect(mockVideoElement.srcObject).toBe(mockStream);
      expect(playSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle permission denied error', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
        permissionError
      );

      const { result } = renderHook(() => useVideoStream());

      await act(async () => {
        await result.current.startStream();
      });

      expect(result.current.stream).toBeNull();
      expect(result.current.error).toContain('Camera permission denied');
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle no camera found error', async () => {
      const deviceError = new Error('No camera');
      deviceError.name = 'NotFoundError';
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
        deviceError
      );

      const { result } = renderHook(() => useVideoStream());

      await act(async () => {
        await result.current.startStream();
      });

      expect(result.current.error).toContain('No camera found');
    });

    it('should handle camera in use error', async () => {
      const busyError = new Error('Camera busy');
      busyError.name = 'NotReadableError';
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
        busyError
      );

      const { result } = renderHook(() => useVideoStream());

      await act(async () => {
        await result.current.startStream();
      });

      expect(result.current.error).toContain('already in use');
    });

    it('should handle browser not supporting camera API', async () => {
      // Temporarily remove getUserMedia
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      // @ts-ignore
      delete navigator.mediaDevices.getUserMedia;

      const { result } = renderHook(() => useVideoStream());

      await act(async () => {
        await result.current.startStream();
      });

      expect(result.current.error).toContain('not supported');

      // Restore
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    });
  });

  describe('Stream Management', () => {
    it('should stop stream and clean up resources', async () => {
      const { result } = renderHook(() => useVideoStream());

      // Start stream first
      await act(async () => {
        await result.current.startStream();
      });

      const tracks = mockStream.getTracks();
      const stopSpy = vi.spyOn(tracks[0], 'stop');

      // Stop stream
      act(() => {
        result.current.stopStream();
      });

      expect(stopSpy).toHaveBeenCalled();
      expect(result.current.stream).toBeNull();
      expect(result.current.hasPermission).toBe(false);
    });

    it('should clean up stream on unmount', async () => {
      const { result, unmount } = renderHook(() => useVideoStream());

      await act(async () => {
        await result.current.startStream();
      });

      const tracks = mockStream.getTracks();
      const stopSpy = vi.spyOn(tracks[0], 'stop');

      unmount();

      expect(stopSpy).toHaveBeenCalled();
    });

    it('should handle multiple start/stop cycles', async () => {
      const { result } = renderHook(() => useVideoStream());

      // First cycle
      await act(async () => {
        await result.current.startStream();
      });
      expect(result.current.stream).toBe(mockStream);

      act(() => {
        result.current.stopStream();
      });
      expect(result.current.stream).toBeNull();

      // Second cycle with new stream
      const mockStream2 = new MediaStream();
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(
        mockStream2
      );

      await act(async () => {
        await result.current.startStream();
      });
      expect(result.current.stream).toBe(mockStream2);
    });
  });

  describe('Frame Capture', () => {
    it('should capture frame from video stream', async () => {
      const { result } = renderHook(() => useVideoStream());

      // Create and attach video element
      const mockVideoElement = document.createElement('video');
      act(() => {
        result.current.videoRef.current = mockVideoElement;
      });

      await act(async () => {
        await result.current.startStream();
      });

      // Capture frame
      let capturedFrame: string | null = null;
      act(() => {
        capturedFrame = result.current.captureFrame();
      });

      expect(capturedFrame).toBeTruthy();
      expect(capturedFrame).toContain('data:image/jpeg;base64');
    });

    it('should return null when capturing without active stream', () => {
      const { result } = renderHook(() => useVideoStream());

      const frame = result.current.captureFrame();

      expect(frame).toBeNull();
    });

    it('should return null when video element not attached', async () => {
      const { result } = renderHook(() => useVideoStream());

      await act(async () => {
        await result.current.startStream();
      });

      // Don't attach video element
      const frame = result.current.captureFrame();

      expect(frame).toBeNull();
    });
  });

  describe('Video Element Synchronization', () => {
    it('should sync stream to video element when stream becomes available', async () => {
      const { result } = renderHook(() => useVideoStream());

      const mockVideoElement = document.createElement('video');
      act(() => {
        result.current.videoRef.current = mockVideoElement;
      });

      await act(async () => {
        await result.current.startStream();
      });

      await waitFor(() => {
        expect(mockVideoElement.srcObject).toBe(mockStream);
      });
    });

    it('should sync stream to video element when ref is attached late', async () => {
      const { result } = renderHook(() => useVideoStream());

      // Start stream first (before ref is attached)
      await act(async () => {
        await result.current.startStream();
      });

      const mockVideoElement = document.createElement('video');

      // Attach ref after stream is ready
      act(() => {
        result.current.videoRef.current = mockVideoElement;
      });

      // Wait for effect to run
      await waitFor(() => {
        expect(mockVideoElement.srcObject).toBe(mockStream);
      });
    });

    it('should clear video element srcObject when stream stops', async () => {
      const { result } = renderHook(() => useVideoStream());

      const mockVideoElement = document.createElement('video');
      act(() => {
        result.current.videoRef.current = mockVideoElement;
      });

      await act(async () => {
        await result.current.startStream();
      });

      expect(mockVideoElement.srcObject).toBe(mockStream);

      act(() => {
        result.current.stopStream();
      });

      expect(mockVideoElement.srcObject).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop calls', async () => {
      const { result } = renderHook(() => useVideoStream());

      // Rapid calls
      await act(async () => {
        result.current.startStream();
        result.current.stopStream();
        result.current.startStream();
        result.current.stopStream();
        await result.current.startStream();
      });

      expect(result.current.stream).toBe(mockStream);
    });

    it('should not crash when stopping non-existent stream', () => {
      const { result } = renderHook(() => useVideoStream());

      expect(() => {
        act(() => {
          result.current.stopStream();
        });
      }).not.toThrow();
    });

    it('should handle getUserMedia throwing synchronous error', async () => {
      vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(() => {
        throw new Error('Sync error');
      });

      const { result } = renderHook(() => useVideoStream());

      await act(async () => {
        await result.current.startStream();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.stream).toBeNull();
    });
  });
});
