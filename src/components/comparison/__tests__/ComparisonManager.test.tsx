import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ComparisonManager from '../ComparisonManager';
import { comparisonManager } from '@/services/comparisonManager';
import { ComparisonResult } from '@/types/comparison';

// Mock the comparison manager service
vi.mock('@/services/comparisonManager', () => ({
  comparisonManager: {
    getComparisonHistory: vi.fn(),
    getSavedComparisons: vi.fn(),
    saveComparison: vi.fn(),
    deleteSavedComparison: vi.fn(),
    searchSavedComparisons: vi.fn(),
    copyComparisonLink: vi.fn(),
    shareToSocialMedia: vi.fn(),
  },
}));

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

describe('ComparisonManager', () => {
  const mockProps = {
    currentComparison: mockComparison,
    onStartNewComparison: vi.fn(),
    onLoadComparison: vi.fn(),
    onModifySelection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (comparisonManager.getComparisonHistory as any).mockReturnValue([]);
    (comparisonManager.getSavedComparisons as any).mockReturnValue([]);
  });

  it('renders comparison manager with tabs', () => {
    render(<ComparisonManager {...mockProps} />);
    
    expect(screen.getByText('Comparison Manager')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('shows new comparison button', () => {
    render(<ComparisonManager {...mockProps} />);
    
    const newComparisonBtn = screen.getByText('New Comparison');
    expect(newComparisonBtn).toBeInTheDocument();
    
    fireEvent.click(newComparisonBtn);
    expect(mockProps.onStartNewComparison).toHaveBeenCalled();
  });

  it('shows save and share buttons when comparison is present', () => {
    render(<ComparisonManager {...mockProps} />);
    
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('opens save modal when save button is clicked', () => {
    render(<ComparisonManager {...mockProps} />);
    
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);
    
    expect(screen.getByRole('heading', { name: 'Save Comparison' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a title for this comparison')).toBeInTheDocument();
  });

  it('opens share modal when share button is clicked', () => {
    render(<ComparisonManager {...mockProps} />);
    
    const shareBtn = screen.getByText('Share');
    fireEvent.click(shareBtn);
    
    expect(screen.getByText('Share Comparison')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
  });

  it('saves comparison with title', async () => {
    const mockSavedComparison = {
      id: 'saved-1',
      title: 'My Test Comparison',
      result: mockComparison,
      isPublic: false,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    (comparisonManager.saveComparison as any).mockResolvedValue(mockSavedComparison);
    
    render(<ComparisonManager {...mockProps} />);
    
    // Open save modal
    fireEvent.click(screen.getByText('Save'));
    
    // Enter title
    const titleInput = screen.getByPlaceholderText('Enter a title for this comparison');
    fireEvent.change(titleInput, { target: { value: 'My Test Comparison' } });
    
    // Save comparison
    fireEvent.click(screen.getByRole('button', { name: 'Save Comparison' }));
    
    await waitFor(() => {
      expect(comparisonManager.saveComparison).toHaveBeenCalledWith(
        mockComparison,
        'My Test Comparison'
      );
    });
  });

  it('switches between tabs', () => {
    render(<ComparisonManager {...mockProps} />);
    
    // Initially on current tab
    expect(screen.getByText('Current Comparison')).toBeInTheDocument();
    
    // Switch to history tab
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Comparison History')).toBeInTheDocument();
    
    // Switch to saved tab
    fireEvent.click(screen.getByText('Saved'));
    expect(screen.getByText('Saved Comparisons')).toBeInTheDocument();
  });

  it('displays current comparison phones with modify buttons', () => {
    render(<ComparisonManager {...mockProps} />);
    
    expect(screen.getByText('Apple iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy S24')).toBeInTheDocument();
    
    const changeButtons = screen.getAllByText('Change');
    expect(changeButtons).toHaveLength(2);
    
    fireEvent.click(changeButtons[0]);
    expect(mockProps.onModifySelection).toHaveBeenCalledWith(0);
  });

  it('handles search in saved comparisons', () => {
    const mockSavedComparisons = [
      {
        id: 'saved-1',
        title: 'iPhone vs Samsung',
        result: mockComparison,
        isPublic: false,
        tags: ['flagship'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    (comparisonManager.getSavedComparisons as any).mockReturnValue(mockSavedComparisons);
    (comparisonManager.searchSavedComparisons as any).mockReturnValue(mockSavedComparisons);
    
    render(<ComparisonManager {...mockProps} />);
    
    // Switch to saved tab
    fireEvent.click(screen.getByText('Saved'));
    
    // Search
    const searchInput = screen.getByPlaceholderText('Search saved...');
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });
    
    expect(comparisonManager.searchSavedComparisons).toHaveBeenCalledWith('iPhone');
  });

  it('deletes saved comparison', async () => {
    const mockSavedComparisons = [
      {
        id: 'saved-1',
        title: 'iPhone vs Samsung',
        result: mockComparison,
        isPublic: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    (comparisonManager.getSavedComparisons as any).mockReturnValue(mockSavedComparisons);
    (comparisonManager.deleteSavedComparison as any).mockReturnValue(true);
    
    render(<ComparisonManager {...mockProps} />);
    
    // Switch to saved tab
    fireEvent.click(screen.getByText('Saved'));
    
    // Delete comparison
    const deleteBtn = screen.getByText('Delete');
    fireEvent.click(deleteBtn);
    
    expect(comparisonManager.deleteSavedComparison).toHaveBeenCalledWith('saved-1');
  });

  it('handles social media sharing', async () => {
    const mockShareUrl = 'https://twitter.com/intent/tweet?text=...';
    (comparisonManager.shareToSocialMedia as any).mockResolvedValue(mockShareUrl);
    
    // Mock window.open
    const mockOpen = vi.fn();
    Object.defineProperty(window, 'open', { value: mockOpen });
    
    render(<ComparisonManager {...mockProps} />);
    
    // Open share modal
    fireEvent.click(screen.getByText('Share'));
    
    // Click Twitter share
    fireEvent.click(screen.getByText('Twitter'));
    
    await waitFor(() => {
      expect(comparisonManager.shareToSocialMedia).toHaveBeenCalledWith(
        mockComparison,
        'twitter'
      );
      expect(mockOpen).toHaveBeenCalledWith(mockShareUrl, '_blank');
    });
  });

  it('handles copy link sharing', async () => {
    const mockUrl = 'https://example.com/comparison/share/token123';
    (comparisonManager.copyComparisonLink as any).mockResolvedValue(mockUrl);
    
    render(<ComparisonManager {...mockProps} />);
    
    // Open share modal
    fireEvent.click(screen.getByText('Share'));
    
    // Click copy link
    fireEvent.click(screen.getByText('Copy Link'));
    
    await waitFor(() => {
      expect(comparisonManager.copyComparisonLink).toHaveBeenCalledWith(mockComparison);
    });
  });
});