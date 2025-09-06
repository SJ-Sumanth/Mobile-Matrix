import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../compare/route';

// Mock services
vi.mock('../../../services/phone', () => ({
  PhoneService: vi.fn().mockImplementation(() => ({
    getPhoneByModel: vi.fn(),
    searchPhones: vi.fn(),
  })),
}));

vi.mock('../../../services/comparison', () => ({
  ComparisonEngine: vi.fn().mockImplementation(() => ({
    comparePhones: vi.fn(),
  })),
}));

describe('/api/compare Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('compares two phones successfully', async () => {
    const mockPhone1 = {
      id: '1',
      brand: 'Apple',
      model: 'iPhone 15',
      specifications: {
        display: { size: '6.1"', resolution: '2556x1179' },
        performance: { processor: 'A16 Bionic' },
      },
      pricing: { currentPrice: 79900, currency: 'INR' },
    };

    const mockPhone2 = {
      id: '2',
      brand: 'Samsung',
      model: 'Galaxy S24',
      specifications: {
        display: { size: '6.2"', resolution: '2340x1080' },
        performance: { processor: 'Snapdragon 8 Gen 3' },
      },
      pricing: { currentPrice: 74999, currency: 'INR' },
    };

    const mockComparison = {
      phones: [mockPhone1, mockPhone2],
      categories: [
        {
          name: 'Display',
          phone1Score: 8.5,
          phone2Score: 8.0,
          winner: 'phone1',
          details: 'iPhone has slightly better display quality',
        },
      ],
      insights: ['Both phones offer excellent performance'],
      recommendations: ['Choose based on ecosystem preference'],
      generatedAt: new Date(),
    };

    const { PhoneService } = await import('../../../services/phone');
    const mockPhoneService = {
      getPhoneByModel: vi.fn()
        .mockResolvedValueOnce(mockPhone1)
        .mockResolvedValueOnce(mockPhone2),
    };
    (PhoneService as any).mockImplementation(() => mockPhoneService);

    const { ComparisonEngine } = await import('../../../services/comparison');
    const mockComparisonEngine = {
      comparePhones: vi.fn().mockResolvedValue(mockComparison),
    };
    (ComparisonEngine as any).mockImplementation(() => mockComparisonEngine);

    const request = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({
        phone1: { brand: 'Apple', model: 'iPhone 15' },
        phone2: { brand: 'Samsung', model: 'Galaxy S24' },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comparison).toEqual(mockComparison);
    expect(mockPhoneService.getPhoneByModel).toHaveBeenCalledTimes(2);
    expect(mockComparisonEngine.comparePhones).toHaveBeenCalledWith(mockPhone1, mockPhone2);
  });

  it('handles phone not found error', async () => {
    const { PhoneService } = await import('../../../services/phone');
    const mockPhoneService = {
      getPhoneByModel: vi.fn().mockResolvedValue(null),
    };
    (PhoneService as any).mockImplementation(() => mockPhoneService);

    const request = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({
        phone1: { brand: 'Apple', model: 'iPhone 99' },
        phone2: { brand: 'Samsung', model: 'Galaxy S24' },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Phone not found: Apple iPhone 99');
  });

  it('validates request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({
        phone1: { brand: 'Apple' }, // Missing model
        phone2: { brand: 'Samsung', model: 'Galaxy S24' },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid request');
  });

  it('handles comparison engine errors', async () => {
    const mockPhone1 = { id: '1', brand: 'Apple', model: 'iPhone 15' };
    const mockPhone2 = { id: '2', brand: 'Samsung', model: 'Galaxy S24' };

    const { PhoneService } = await import('../../../services/phone');
    const mockPhoneService = {
      getPhoneByModel: vi.fn()
        .mockResolvedValueOnce(mockPhone1)
        .mockResolvedValueOnce(mockPhone2),
    };
    (PhoneService as any).mockImplementation(() => mockPhoneService);

    const { ComparisonEngine } = await import('../../../services/comparison');
    const mockComparisonEngine = {
      comparePhones: vi.fn().mockRejectedValue(new Error('Comparison failed')),
    };
    (ComparisonEngine as any).mockImplementation(() => mockComparisonEngine);

    const request = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({
        phone1: { brand: 'Apple', model: 'iPhone 15' },
        phone2: { brand: 'Samsung', model: 'Galaxy S24' },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to compare phones');
  });

  it('handles same phone comparison', async () => {
    const request = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({
        phone1: { brand: 'Apple', model: 'iPhone 15' },
        phone2: { brand: 'Apple', model: 'iPhone 15' },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Cannot compare the same phone');
  });

  it('handles malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid JSON');
  });

  it('supports phone variants in comparison', async () => {
    const mockPhone1 = {
      id: '1',
      brand: 'Apple',
      model: 'iPhone 15',
      variant: 'Pro',
    };

    const mockPhone2 = {
      id: '2',
      brand: 'Apple',
      model: 'iPhone 15',
      variant: 'Pro Max',
    };

    const { PhoneService } = await import('../../../services/phone');
    const mockPhoneService = {
      getPhoneByModel: vi.fn()
        .mockResolvedValueOnce(mockPhone1)
        .mockResolvedValueOnce(mockPhone2),
    };
    (PhoneService as any).mockImplementation(() => mockPhoneService);

    const { ComparisonEngine } = await import('../../../services/comparison');
    const mockComparisonEngine = {
      comparePhones: vi.fn().mockResolvedValue({
        phones: [mockPhone1, mockPhone2],
        categories: [],
        insights: [],
        recommendations: [],
        generatedAt: new Date(),
      }),
    };
    (ComparisonEngine as any).mockImplementation(() => mockComparisonEngine);

    const request = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({
        phone1: { brand: 'Apple', model: 'iPhone 15', variant: 'Pro' },
        phone2: { brand: 'Apple', model: 'iPhone 15', variant: 'Pro Max' },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockPhoneService.getPhoneByModel).toHaveBeenCalledWith('Apple', 'iPhone 15', 'Pro');
    expect(mockPhoneService.getPhoneByModel).toHaveBeenCalledWith('Apple', 'iPhone 15', 'Pro Max');
  });
});