import { 
  ComparisonResult, 
  MultiPhoneComparison, 
  SavedComparison, 
  ComparisonHistoryEntry,
  ShareComparison 
} from '@/types/comparison';
import { Phone } from '@/types/phone';
import { comparisonService } from './comparison';

/**
 * Service for managing phone comparisons, history, and sharing
 */
export class ComparisonManagerService {
  private comparisonHistory: ComparisonHistoryEntry[] = [];
  private savedComparisons: SavedComparison[] = [];

  /**
   * Start a new comparison with selected phones
   */
  async startNewComparison(phoneIds: string[]): Promise<ComparisonResult | MultiPhoneComparison> {
    if (phoneIds.length < 2) {
      throw new Error('At least 2 phones are required for comparison');
    }

    if (phoneIds.length > 5) {
      throw new Error('Maximum 5 phones can be compared at once');
    }

    // Add to history
    const historyEntry: ComparisonHistoryEntry = {
      id: this.generateId(),
      phoneIds,
      phoneNames: [], // Will be populated after fetching phone data
      comparisonType: phoneIds.length === 2 ? 'two-phone' : 'multi-phone',
      timestamp: new Date(),
    };

    this.addToHistory(historyEntry);

    if (phoneIds.length === 2) {
      return await comparisonService.comparePhones(phoneIds[0], phoneIds[1]);
    } else {
      return await this.compareMultiplePhones(phoneIds);
    }
  }

  /**
   * Modify phone selection in existing comparison
   */
  async modifyComparison(
    comparisonId: string, 
    phoneIndex: number, 
    newPhoneId: string
  ): Promise<ComparisonResult | MultiPhoneComparison> {
    // Implementation for modifying existing comparison
    throw new Error('Method not implemented yet');
  }

  /**
   * Compare multiple phones (more than 2)
   */
  private async compareMultiplePhones(phoneIds: string[]): Promise<MultiPhoneComparison> {
    // Implementation for multi-phone comparison
    throw new Error('Method not implemented yet');
  }

  /**
   * Save a comparison for later access
   */
  async saveComparison(
    comparison: ComparisonResult | MultiPhoneComparison,
    title?: string,
    userId?: string
  ): Promise<SavedComparison> {
    const savedComparison: SavedComparison = {
      id: this.generateId(),
      userId,
      title: title || this.generateComparisonTitle(comparison),
      result: comparison,
      isPublic: false,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.savedComparisons.push(savedComparison);
    return savedComparison;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateComparisonTitle(comparison: ComparisonResult | MultiPhoneComparison): string {
    if ('phones' in comparison && comparison.phones.length === 2) {
      return `${comparison.phones[0].brand} ${comparison.phones[0].model} vs ${comparison.phones[1].brand} ${comparison.phones[1].model}`;
    }
    return `Multi-phone comparison`;
  }

  private addToHistory(entry: ComparisonHistoryEntry): void {
    this.comparisonHistory.unshift(entry);
    // Keep only last 50 entries
    if (this.comparisonHistory.length > 50) {
      this.comparisonHistory = this.comparisonHistory.slice(0, 50);
    }
  }

  /**
   * Get comparison history
   */
  getComparisonHistory(): ComparisonHistoryEntry[] {
    return [...this.comparisonHistory];
  }

  /**
   * Get saved comparisons
   */
  getSavedComparisons(userId?: string): SavedComparison[] {
    if (userId) {
      return this.savedComparisons.filter(comp => comp.userId === userId);
    }
    return [...this.savedComparisons];
  }

  /**
   * Delete saved comparison
   */
  deleteSavedComparison(comparisonId: string, userId?: string): boolean {
    const index = this.savedComparisons.findIndex(comp => 
      comp.id === comparisonId && (!userId || comp.userId === userId)
    );
    
    if (index !== -1) {
      this.savedComparisons.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Generate share URL for comparison
   */
  async generateShareUrl(comparison: ComparisonResult | MultiPhoneComparison): Promise<ShareComparison> {
    const shareToken = this.generateShareToken();
    const phoneNames = 'phones' in comparison && Array.isArray(comparison.phones) 
      ? comparison.phones.map(phone => `${phone.brand} ${phone.model}`)
      : [];

    const shareData: ShareComparison = {
      id: comparison.id,
      shareToken,
      title: this.generateComparisonTitle(comparison),
      description: `Compare ${phoneNames.join(' vs ')} specifications and features`,
      phoneNames,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/comparison/share/${shareToken}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    return shareData;
  }

  /**
   * Share comparison via social media
   */
  async shareToSocialMedia(
    comparison: ComparisonResult | MultiPhoneComparison,
    platform: 'twitter' | 'facebook' | 'whatsapp' | 'linkedin'
  ): Promise<string> {
    const shareData = await this.generateShareUrl(comparison);
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedTitle = encodeURIComponent(shareData.title);
    const encodedDescription = encodeURIComponent(shareData.description);

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Copy comparison link to clipboard
   */
  async copyComparisonLink(comparison: ComparisonResult | MultiPhoneComparison): Promise<string> {
    const shareData = await this.generateShareUrl(comparison);
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
    }
    
    return shareData.url;
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Clear comparison history
   */
  clearHistory(): void {
    this.comparisonHistory = [];
  }

  /**
   * Search saved comparisons
   */
  searchSavedComparisons(query: string, userId?: string): SavedComparison[] {
    const comparisons = this.getSavedComparisons(userId);
    const lowerQuery = query.toLowerCase();
    
    return comparisons.filter(comp => 
      comp.title?.toLowerCase().includes(lowerQuery) ||
      comp.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

export const comparisonManager = new ComparisonManagerService();