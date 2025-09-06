import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, PUT } from '../manage/route';
import { comparisonManager } from '@/services/comparisonManager';

// Mock the comparison manager
vi.mock('@/services/comparisonManager', () => ({
  comparisonManager: {
    startNewComparison: vi.fn(),
    saveComparison: vi.fn(),
    modifyComparison: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

vi.mock('@/middleware/validation', () => ({
  withValidation: (schema: any, handler: any) => (request: any) => {
    // Simple mock validation - just pass through
    return handler(request.json ? request.json() : {});
  },
}));

vi.mock('@/middleware/errorHandler', () => ({
  withErrorHandler: (handler: any) => handler,
}));

describe('/api/comparison/manage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - Start new comparison', () => {
    it('should start comparison with 2 phones', async () => {
      const mockComparison = {
        id: 'comparison-1',
        phones: [{ id: 'phone1' }, { id: 'phone2' }],
        summary: 'Test comparison',
      };

      (comparisonManager.startNewComparison as any).mockResolvedValue(mockComparison);

      const request = new NextRequest('http://localhost/api/comparison/manage', {
        method: 'POST',
        body: JSON.stringify({
          phoneIds: ['phone1', 'phone2'],
          userId: 'user123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockComparison);
      expect(comparisonManager.startNewComparison).toHaveBeenCalledWith(['phone1', 'phone2']);
    });

    it('should start comparison with multiple phones', async () => {
      const mockComparison = {
        id: 'comparison-1',
        phones: [{ id: 'phone1' }, { id: 'phone2' }, { id: 'phone3' }],
        summary: 'Multi-phone comparison',
      };

      (comparisonManager.startNewComparison as any).mockResolvedValue(mockComparison);

      const request = new NextRequest('http://localhost/api/comparison/manage', {
        method: 'POST',
        body: JSON.stringify({
          phoneIds: ['phone1', 'phone2', 'phone3'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(comparisonManager.startNewComparison).toHaveBeenCalledWith(['phone1', 'phone2', 'phone3']);
    });

    it('should handle comparison errors', async () => {
      (comparisonManager.startNewComparison as any).mockRejectedValue(
        new Error('At least 2 phones are required for comparison')
      );

      const request = new NextRequest('http://localhost/api/comparison/manage', {
        method: 'POST',
        body: JSON.stringify({
          phoneIds: ['phone1'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('At least 2 phones are required for comparison');
    });
  });

  describe('PUT - Save or modify comparison', () => {
    it('should save comparison with title', async () => {
      const mockSavedComparison = {
        id: 'saved-1',
        title: 'My Comparison',
        result: { id: 'comparison-1' },
        createdAt: new Date(),
      };

      (comparisonManager.saveComparison as any).mockResolvedValue(mockSavedComparison);

      const request = new NextRequest('http://localhost/api/comparison/manage', {
        method: 'PUT',
        body: JSON.stringify({
          comparisonId: 'comparison-1',
          title: 'My Comparison',
          userId: 'user123',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSavedComparison);
    });

    it('should modify comparison phone selection', async () => {
      const mockModifiedComparison = {
        id: 'comparison-1',
        phones: [{ id: 'phone1' }, { id: 'phone3' }], // phone2 replaced with phone3
        summary: 'Modified comparison',
      };

      (comparisonManager.modifyComparison as any).mockResolvedValue(mockModifiedComparison);

      const request = new NextRequest('http://localhost/api/comparison/manage', {
        method: 'PUT',
        body: JSON.stringify({
          comparisonId: 'comparison-1',
          phoneIndex: 1,
          newPhoneId: 'phone3',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockModifiedComparison);
      expect(comparisonManager.modifyComparison).toHaveBeenCalledWith('comparison-1', 1, 'phone3');
    });

    it('should handle save errors', async () => {
      (comparisonManager.saveComparison as any).mockRejectedValue(
        new Error('Failed to save comparison')
      );

      const request = new NextRequest('http://localhost/api/comparison/manage', {
        method: 'PUT',
        body: JSON.stringify({
          comparisonId: 'comparison-1',
          title: 'My Comparison',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Failed to save comparison');
    });

    it('should handle modify errors', async () => {
      (comparisonManager.modifyComparison as any).mockRejectedValue(
        new Error('Invalid phone index')
      );

      const request = new NextRequest('http://localhost/api/comparison/manage', {
        method: 'PUT',
        body: JSON.stringify({
          comparisonId: 'comparison-1',
          phoneIndex: 5,
          newPhoneId: 'phone3',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid phone index');
    });
  });
});