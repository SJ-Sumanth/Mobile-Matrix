import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComparisonManagerService } from '../comparisonManager';
import { ComparisonResult, MultiPhoneComparison } from '@/types/comparison';

// Mock the comparison service
vi.mock('../comparison', () => ({
  comparisonService: {
    comparePhones: vi.fn(),
  },
}));

describe('ComparisonManagerService', () => {
  let service: ComparisonManagerService;

  const mockComparison: ComparisonResult = {
    id: 'test-comparison-1',
    phones: [
      {
        id: 'phone1',
        brand: 'Apple',
        model: 'iPhone 15',
        variant: 'Pro',
        launchDate: new Date('2023-09-15'),
        availability: 'available',
        pricing: { mrp: 99900, currentPrice: 94900, currency: 'INR' },
        specifications: {},
        images: [],
      },
      {
        id: 'phone2',
        brand: 'Samsung',
        model: 'Galaxy S24',
        variant: 'Ultra',
        launchDate: new Date('2024-01-24'),
        availability: 'available',
        pricing: { mrp: 129900, currentPrice: 119900, currency: 'INR' },
        specifications: {},
        images: [],
      },
    ],
    categories: [],
    scores: { phone1: {}, phone2: {} },
    overallWinner: 'phone1',
    insights: {
      strengths: { phone1: [], phone2: [] },
      weaknesses: { phone1: [], phone2: [] },
      recommendations: [],
      bestFor: { phone1: [], phone2: [] },
    },
    summary: 'Test comparison',
    generatedAt: new Date(),
  };

  beforeEach(() => {
    service = new ComparisonManagerService();
    vi.clearAllMocks();
  });

  describe('startNewComparison', () => {
    it('should throw error for less than 2 phones', async () => {
      await expect(service.startNewComparison(['phone1'])).rejects.toThrow(
        'At least 2 phones are required for comparison'
      );
    });

    it('should throw error for more than 5 phones', async () => {
      const phoneIds = ['phone1', 'phone2', 'phone3', 'phone4', 'phone5', 'phone6'];
      await expect(service.startNewComparison(phoneIds)).rejects.toThrow(
        'Maximum 5 phones can be compared at once'
      );
    });

    it('should add comparison to history', async () => {
      const phoneIds = ['phone1', 'phone2'];
      
      // Mock the comparison service
      const { comparisonService } = await import('../comparison');
      (comparisonService.comparePhones as any).mockResolvedValue(mockComparison);

      await service.startNewComparison(phoneIds);

      const history = service.getComparisonHistory();
      expect(history).toHaveLength(1);
      expect(history[0].phoneIds).toEqual(phoneIds);
      expect(history[0].comparisonType).toBe('two-phone');
    });

    it('should handle multi-phone comparison', async () => {
      const phoneIds = ['phone1', 'phone2', 'phone3'];
      
      await expect(service.startNewComparison(phoneIds)).rejects.toThrow(
        'Method not implemented yet'
      );
    });
  });

  describe('saveComparison', () => {
    it('should save comparison with generated title', async () => {
      const saved = await service.saveComparison(mockComparison);

      expect(saved.id).toBeDefined();
      expect(saved.title).toBe('Apple iPhone 15 vs Samsung Galaxy S24');
      expect(saved.result).toBe(mockComparison);
      expect(saved.isPublic).toBe(false);
    });

    it('should save comparison with custom title', async () => {
      const customTitle = 'My Custom Comparison';
      const saved = await service.saveComparison(mockComparison, customTitle);

      expect(saved.title).toBe(customTitle);
    });

    it('should save comparison with user ID', async () => {
      const userId = 'user123';
      const saved = await service.saveComparison(mockComparison, undefined, userId);

      expect(saved.userId).toBe(userId);
    });
  });

  describe('getSavedComparisons', () => {
    it('should return all saved comparisons when no user ID provided', async () => {
      await service.saveComparison(mockComparison, 'Test 1');
      await service.saveComparison(mockComparison, 'Test 2');

      const saved = service.getSavedComparisons();
      expect(saved).toHaveLength(2);
    });

    it('should filter by user ID when provided', async () => {
      await service.saveComparison(mockComparison, 'Test 1', 'user1');
      await service.saveComparison(mockComparison, 'Test 2', 'user2');

      const saved = service.getSavedComparisons('user1');
      expect(saved).toHaveLength(1);
      expect(saved[0].userId).toBe('user1');
    });
  });

  describe('deleteSavedComparison', () => {
    it('should delete saved comparison', async () => {
      const saved = await service.saveComparison(mockComparison);
      
      const success = service.deleteSavedComparison(saved.id);
      expect(success).toBe(true);

      const remaining = service.getSavedComparisons();
      expect(remaining).toHaveLength(0);
    });

    it('should return false for non-existent comparison', () => {
      const success = service.deleteSavedComparison('non-existent');
      expect(success).toBe(false);
    });

    it('should respect user ID when deleting', async () => {
      const saved = await service.saveComparison(mockComparison, 'Test', 'user1');
      
      // Try to delete with wrong user ID
      const success1 = service.deleteSavedComparison(saved.id, 'user2');
      expect(success1).toBe(false);

      // Delete with correct user ID
      const success2 = service.deleteSavedComparison(saved.id, 'user1');
      expect(success2).toBe(true);
    });
  });

  describe('generateShareUrl', () => {
    it('should generate share data for comparison', async () => {
      const shareData = await service.generateShareUrl(mockComparison);

      expect(shareData.id).toBe(mockComparison.id);
      expect(shareData.shareToken).toBeDefined();
      expect(shareData.title).toBe('Apple iPhone 15 vs Samsung Galaxy S24');
      expect(shareData.phoneNames).toEqual(['Apple iPhone 15', 'Samsung Galaxy S24']);
      expect(shareData.url).toContain('/comparison/share/');
      expect(shareData.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('shareToSocialMedia', () => {
    it('should generate Twitter share URL', async () => {
      const shareUrl = await service.shareToSocialMedia(mockComparison, 'twitter');
      expect(shareUrl).toContain('twitter.com/intent/tweet');
    });

    it('should generate Facebook share URL', async () => {
      const shareUrl = await service.shareToSocialMedia(mockComparison, 'facebook');
      expect(shareUrl).toContain('facebook.com/sharer/sharer.php');
    });

    it('should generate WhatsApp share URL', async () => {
      const shareUrl = await service.shareToSocialMedia(mockComparison, 'whatsapp');
      expect(shareUrl).toContain('wa.me');
    });

    it('should generate LinkedIn share URL', async () => {
      const shareUrl = await service.shareToSocialMedia(mockComparison, 'linkedin');
      expect(shareUrl).toContain('linkedin.com/sharing/share-offsite');
    });

    it('should throw error for unsupported platform', async () => {
      await expect(
        service.shareToSocialMedia(mockComparison, 'unsupported' as any)
      ).rejects.toThrow('Unsupported platform: unsupported');
    });
  });

  describe('searchSavedComparisons', () => {
    beforeEach(async () => {
      await service.saveComparison(mockComparison, 'iPhone vs Samsung');
      await service.saveComparison(mockComparison, 'Android Flagship Battle');
    });

    it('should search by title', () => {
      const results = service.searchSavedComparisons('iPhone');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('iPhone');
    });

    it('should search case-insensitively', () => {
      const results = service.searchSavedComparisons('iphone');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', () => {
      const results = service.searchSavedComparisons('Nokia');
      expect(results).toHaveLength(0);
    });
  });

  describe('getComparisonHistory', () => {
    it('should return copy of history array', () => {
      const history1 = service.getComparisonHistory();
      const history2 = service.getComparisonHistory();
      
      expect(history1).not.toBe(history2); // Different array instances
      expect(history1).toEqual(history2); // Same content
    });

    it('should limit history to 50 entries', async () => {
      // Add 60 comparisons to test limit
      for (let i = 0; i < 60; i++) {
        try {
          await service.startNewComparison(['phone1', 'phone2']);
        } catch (error) {
          // Expected to fail due to mock, but should still add to history
        }
      }

      const history = service.getComparisonHistory();
      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history entries', async () => {
      // Add some history entries
      try {
        await service.startNewComparison(['phone1', 'phone2']);
      } catch (error) {
        // Expected to fail due to mock
      }

      service.clearHistory();
      const history = service.getComparisonHistory();
      expect(history).toHaveLength(0);
    });
  });
});