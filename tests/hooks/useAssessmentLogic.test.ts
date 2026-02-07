import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAssessmentLogic } from '@/hooks/useAssessmentLogic';
import { UIMessage } from '@/lib/types';
import * as consentLib from '@/lib/consent';
import * as reportParser from '@/lib/report-parser';
import * as validation from '@/lib/validation';

// Mock dependencies
vi.mock('@/lib/consent', () => ({
  hasAcceptedConsent: vi.fn(),
}));

vi.mock('@/lib/report-parser', () => ({
  parseAssessmentReport: vi.fn(),
  isAssessmentComplete: vi.fn(),
  removeCompletionMarker: vi.fn(),
}));

vi.mock('@/lib/validation', () => ({
  sanitizeConversationHistory: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('useAssessmentLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAssessmentLogic());

      expect(result.current[0].isComplete).toBe(false);
      expect(result.current[0].report).toBe('');
      expect(result.current[0].submissionError).toBe('');
      expect(result.current[0].isSubmitting).toBe(false);
    });
  });

  describe('checkCompletion', () => {
    it('should not mark complete when messages are incomplete', () => {
      vi.mocked(reportParser.isAssessmentComplete).mockReturnValue(false);

      const { result } = renderHook(() => useAssessmentLogic());

      const incompleteMessages: UIMessage[] = [
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hello, what is your organization?' }],
        },
      ];

      act(() => {
        result.current[1].checkCompletion(incompleteMessages);
      });

      expect(result.current[0].isComplete).toBe(false);
      expect(result.current[0].report).toBe('');
    });

    it('should mark complete when assessment completion marker is found', async () => {
      vi.mocked(reportParser.isAssessmentComplete).mockReturnValue(true);
      vi.mocked(reportParser.removeCompletionMarker).mockReturnValue('Cleaned report content');
      vi.mocked(reportParser.parseAssessmentReport).mockReturnValue({
        organization: 'Test Org',
        domain: 'Test Domain',
        readinessLevel: 'High',
        solutions: [],
        nextSteps: [],
      });
      vi.mocked(validation.sanitizeConversationHistory).mockReturnValue('sanitized history');
      vi.mocked(consentLib.hasAcceptedConsent).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useAssessmentLogic());

      const completeMessages: UIMessage[] = [
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Report content ###ASSESSMENT_COMPLETE###' }],
        },
      ];

      act(() => {
        result.current[1].checkCompletion(completeMessages);
      });

      expect(result.current[0].isComplete).toBe(true);
      expect(result.current[0].report).toBe('Cleaned report content');
      expect(reportParser.removeCompletionMarker).toHaveBeenCalled();
    });

    it('should handle multiple message parts', () => {
      vi.mocked(reportParser.isAssessmentComplete).mockReturnValue(true);
      vi.mocked(reportParser.removeCompletionMarker).mockReturnValue('Combined content');

      const { result } = renderHook(() => useAssessmentLogic());

      const messagesWithMultipleParts: UIMessage[] = [
        {
          id: '1',
          role: 'assistant',
          parts: [
            { type: 'text', text: 'Part 1 ' },
            { type: 'text', text: 'Part 2 ' },
            { type: 'text', text: '###ASSESSMENT_COMPLETE###' },
          ],
        },
      ];

      act(() => {
        result.current[1].checkCompletion(messagesWithMultipleParts);
      });

      expect(reportParser.isAssessmentComplete).toHaveBeenCalledWith('Part 1 Part 2 ###ASSESSMENT_COMPLETE###');
    });

    it('should prevent duplicate submissions', async () => {
      vi.mocked(reportParser.isAssessmentComplete).mockReturnValue(true);
      vi.mocked(reportParser.removeCompletionMarker).mockReturnValue('Report');
      vi.mocked(reportParser.parseAssessmentReport).mockReturnValue({
        organization: 'Test Org',
        domain: 'Test Domain',
        readinessLevel: 'High',
        solutions: [],
        nextSteps: [],
      });
      vi.mocked(validation.sanitizeConversationHistory).mockReturnValue('history');
      vi.mocked(consentLib.hasAcceptedConsent).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useAssessmentLogic());

      const completeMessages: UIMessage[] = [
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: '###ASSESSMENT_COMPLETE###' }],
        },
      ];

      // First call
      await act(async () => {
        result.current[1].checkCompletion(completeMessages);
        // Wait a tick for async submission to start
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });

      // Second call should not trigger another submission
      await act(async () => {
        result.current[1].checkCompletion(completeMessages);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should still be only 1 call
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleSendMessage', () => {
    it('should set isSubmitting to true and clear errors', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAssessmentLogic());

      act(() => {
        result.current[1].handleSendMessage('test message', mockSendMessage);
      });

      expect(result.current[0].isSubmitting).toBe(true);
      expect(result.current[0].submissionError).toBe('');
    });

    it('should call sendMessage with correct parameters', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAssessmentLogic());

      await act(async () => {
        await result.current[1].handleSendMessage('test message', mockSendMessage);
      });

      expect(mockSendMessage).toHaveBeenCalledWith({ text: 'test message' });
    });

    it('should handle sendMessage success', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAssessmentLogic());

      await act(async () => {
        await result.current[1].handleSendMessage('test', mockSendMessage);
      });

      // After successful send, isSubmitting should still be true until timeout clears
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('should handle sendMessage failure', async () => {
      const mockSendMessage = vi.fn().mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useAssessmentLogic());

      await act(async () => {
        await result.current[1].handleSendMessage('test', mockSendMessage);
      });

      expect(result.current[0].isSubmitting).toBe(false);
    });

    it('should trigger timeout error after 30 seconds', async () => {
      vi.useFakeTimers();
      const mockSendMessage = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      const { result } = renderHook(() => useAssessmentLogic());

      act(() => {
        result.current[1].handleSendMessage('test', mockSendMessage);
      });

      expect(result.current[0].isSubmitting).toBe(true);

      // Fast-forward time by 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current[0].submissionError).toBe(
        'Request is taking longer than expected. Please try again.'
      );
      expect(result.current[0].isSubmitting).toBe(false);
      
      vi.useRealTimers();
    });

    it('should clear timeout on successful completion', async () => {
      vi.useFakeTimers();
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAssessmentLogic());

      await act(async () => {
        await result.current[1].handleSendMessage('test', mockSendMessage);
      });

      // Advance time to ensure timeout would have fired if not cleared
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Should not have timeout error
      expect(result.current[0].submissionError).toBe('');
      
      vi.useRealTimers();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      vi.mocked(reportParser.isAssessmentComplete).mockReturnValue(true);
      vi.mocked(reportParser.removeCompletionMarker).mockReturnValue('Report');
      vi.mocked(reportParser.parseAssessmentReport).mockReturnValue({
        organization: 'Test Org',
        domain: 'Test Domain',
        readinessLevel: 'High',
        solutions: [],
        nextSteps: [],
      });
      vi.mocked(validation.sanitizeConversationHistory).mockReturnValue('history');
      vi.mocked(consentLib.hasAcceptedConsent).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useAssessmentLogic());

      // Set some state
      const completeMessages: UIMessage[] = [
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: '###ASSESSMENT_COMPLETE###' }],
        },
      ];

      act(() => {
        result.current[1].checkCompletion(completeMessages);
      });

      expect(result.current[0].isComplete).toBe(true);

      // Reset
      act(() => {
        result.current[1].reset();
      });

      expect(result.current[0].isComplete).toBe(false);
      expect(result.current[0].report).toBe('');
      expect(result.current[0].submissionError).toBe('');
      expect(result.current[0].isSubmitting).toBe(false);
    });

    it('should clear any active timeout', async () => {
      vi.useFakeTimers();
      const mockSendMessage = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      const { result } = renderHook(() => useAssessmentLogic());

      act(() => {
        result.current[1].handleSendMessage('test', mockSendMessage);
      });

      // Reset before timeout fires
      act(() => {
        result.current[1].reset();
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Should not have timeout error because reset cleared it
      expect(result.current[0].submissionError).toBe('');
      
      vi.useRealTimers();
    });
  });

  describe('clearError', () => {
    it('should clear submission error', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useAssessmentLogic());

      // Set an error manually by triggering timeout
      const mockSendMessage = vi.fn().mockImplementation(
        () => new Promise(() => {})
      );

      act(() => {
        result.current[1].handleSendMessage('test', mockSendMessage);
      });

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current[0].submissionError).toBeTruthy();

      // Clear error
      act(() => {
        result.current[1].clearError();
      });

      expect(result.current[0].submissionError).toBe('');
      
      vi.useRealTimers();
    });
  });

  describe('Submission Logic', () => {
    it('should submit assessment when consent is accepted', async () => {
      vi.mocked(reportParser.isAssessmentComplete).mockReturnValue(true);
      vi.mocked(reportParser.removeCompletionMarker).mockReturnValue('Report');
      vi.mocked(reportParser.parseAssessmentReport).mockReturnValue({
        organization: 'Test Org',
        domain: 'Test Domain',
        readinessLevel: 'High',
        solutions: [
          {
            priority: 'P1',
            category: 'AI Tool',
            group: 'Productivity',
            fit: 'High',
            rationale: 'Good fit',
          },
        ],
        nextSteps: ['Step 1', 'Step 2'],
      });
      vi.mocked(validation.sanitizeConversationHistory).mockReturnValue('sanitized');
      vi.mocked(consentLib.hasAcceptedConsent).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const { result } = renderHook(() => useAssessmentLogic());

      const completeMessages: UIMessage[] = [
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: '###ASSESSMENT_COMPLETE###' }],
        },
      ];

      await act(async () => {
        result.current[1].checkCompletion(completeMessages);
        // Wait a tick for async submission to start
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test Org'),
        });
      }, { timeout: 1000 });
    });

    it('should show warning when consent is declined', async () => {
      vi.mocked(reportParser.isAssessmentComplete).mockReturnValue(true);
      vi.mocked(reportParser.removeCompletionMarker).mockReturnValue('Report');
      vi.mocked(reportParser.parseAssessmentReport).mockReturnValue({
        organization: 'Test Org',
        domain: 'Test Domain',
        readinessLevel: 'High',
        solutions: [],
        nextSteps: [],
      });
      vi.mocked(validation.sanitizeConversationHistory).mockReturnValue('sanitized');
      vi.mocked(consentLib.hasAcceptedConsent).mockReturnValue(false);

      const { result } = renderHook(() => useAssessmentLogic());

      const completeMessages: UIMessage[] = [
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: '###ASSESSMENT_COMPLETE###' }],
        },
      ];

      await act(async () => {
        result.current[1].checkCompletion(completeMessages);
        // Wait a tick for async submission to start
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(result.current[0].submissionError).toContain('privacy preference');
        expect(global.fetch).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should handle submission API errors gracefully', async () => {
      vi.mocked(reportParser.isAssessmentComplete).mockReturnValue(true);
      vi.mocked(reportParser.removeCompletionMarker).mockReturnValue('Report');
      vi.mocked(reportParser.parseAssessmentReport).mockReturnValue({
        organization: 'Test Org',
        domain: 'Test Domain',
        readinessLevel: 'High',
        solutions: [],
        nextSteps: [],
      });
      vi.mocked(validation.sanitizeConversationHistory).mockReturnValue('sanitized');
      vi.mocked(consentLib.hasAcceptedConsent).mockReturnValue(true);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const { result } = renderHook(() => useAssessmentLogic());

      const completeMessages: UIMessage[] = [
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: '###ASSESSMENT_COMPLETE###' }],
        },
      ];

      await act(async () => {
        result.current[1].checkCompletion(completeMessages);
        // Wait a tick for async submission to start
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(result.current[0].submissionError).toContain('Warning');
        expect(result.current[0].submissionError).toContain('Server error');
      }, { timeout: 1000 });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timeout on unmount', () => {
      vi.useFakeTimers();
      const mockSendMessage = vi.fn().mockImplementation(
        () => new Promise(() => {})
      );
      const { result, unmount } = renderHook(() => useAssessmentLogic());

      act(() => {
        result.current[1].handleSendMessage('test', mockSendMessage);
      });

      // Unmount before timeout fires
      unmount();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // No error should occur from timeout after unmount
      // (This test mainly ensures no memory leaks or errors)
      
      vi.useRealTimers();
    });
  });
});
