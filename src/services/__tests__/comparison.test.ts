import { describe, it, expect, beforeEach } from 'vitest';
import { ComparisonEngine, VisualComparisonData } from '../comparison.js';
import { Phone, PhoneScores } from '../../types/phone.js';
import { ComparisonResult, ComparisonWinner } from '../../types/comparison.js';

describe('ComparisonEngine', () => {
  let comparisonEngine: ComparisonEngine;
  let mockPhone1: Phone;
  let mockPhone2: Phone;

  beforeEach(() => {
    comparisonEngine = new ComparisonEngine();
    
    // Mock phone 1 - High-end phone
    mockPhone1 = {
      id: 'phone-1',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      variant: '256GB',
      launchDate: new Date('2024-01-01'),
      availability: 'available',
      pricing: {
        mrp: 130000,
        currentPrice: 125000,
        currency: 'INR',
      },
      specifications: {
        display: {
          size: '6.8"',
          resolution: '1440x3120',
          type: 'Dynamic AMOLED',
          refreshRate: 120,
          brightness: 1750,
        },
        camera: {
          rear: [
            { megapixels: 200, aperture: '1.7', features: ['OIS', 'Laser AF'], videoRecording: '8K@30fps' },
            { megapixels: 50, aperture: '2.2', features: ['Ultra-wide'], videoRecording: '4K@60fps' },
            { megapixels: 10, aperture: '2.4', features: ['Telephoto', '3x zoom'], videoRecording: '4K@60fps' },
            { megapixels: 10, aperture: '4.9', features: ['Periscope', '10x zoom'], videoRecording: '4K@60fps' },
          ],
          front: { megapixels: 12, aperture: '2.2', features: ['Auto-focus'], videoRecording: '4K@60fps' },
          features: ['Night Mode', 'Pro Mode', 'Portrait Mode', 'Super Steady'],
        },
        performance: {
          processor: 'Snapdragon 8 Gen 3',
          gpu: 'Adreno 750',
          ram: ['12GB', '16GB'],
          storage: ['256GB', '512GB', '1TB'],
          expandableStorage: false,
        },
        battery: {
          capacity: 5000,
          chargingSpeed: 45,
          wirelessCharging: true,
        },
        connectivity: {
          network: ['5G', '4G LTE', '3G', '2G'],
          wifi: 'Wi-Fi 7',
          bluetooth: '5.3',
          nfc: true,
        },
        build: {
          dimensions: '162.3 x 79.0 x 8.6 mm',
          weight: '232g',
          materials: ['Gorilla Glass Victus 2', 'Titanium Frame'],
          colors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'],
          waterResistance: 'IP68',
        },
        software: {
          os: 'Android',
          version: '14',
          updateSupport: '7 years',
        },
      },
      images: ['image1.jpg', 'image2.jpg'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    // Mock phone 2 - Mid-range phone
    mockPhone2 = {
      id: 'phone-2',
      brand: 'OnePlus',
      model: '12R',
      variant: '128GB',
      launchDate: new Date('2024-02-01'),
      availability: 'available',
      pricing: {
        mrp: 45000,
        currentPrice: 42000,
        currency: 'INR',
      },
      specifications: {
        display: {
          size: '6.78"',
          resolution: '1264x2780',
          type: 'LTPO4 AMOLED',
          refreshRate: 120,
          brightness: 4500,
        },
        camera: {
          rear: [
            { megapixels: 50, aperture: '1.8', features: ['OIS'], videoRecording: '4K@60fps' },
            { megapixels: 8, aperture: '2.2', features: ['Ultra-wide'], videoRecording: '1080p@30fps' },
            { megapixels: 2, aperture: '2.4', features: ['Macro'], videoRecording: '1080p@30fps' },
          ],
          front: { megapixels: 16, aperture: '2.4', features: [], videoRecording: '1080p@30fps' },
          features: ['Night Mode', 'Portrait Mode'],
        },
        performance: {
          processor: 'Snapdragon 8 Gen 2',
          gpu: 'Adreno 740',
          ram: ['8GB', '16GB'],
          storage: ['128GB', '256GB'],
          expandableStorage: false,
        },
        battery: {
          capacity: 5400,
          chargingSpeed: 100,
          wirelessCharging: false,
        },
        connectivity: {
          network: ['5G', '4G LTE', '3G', '2G'],
          wifi: 'Wi-Fi 6',
          bluetooth: '5.3',
          nfc: true,
        },
        build: {
          dimensions: '163.3 x 75.3 x 8.8 mm',
          weight: '207g',
          materials: ['Gorilla Glass Victus 2', 'Aluminum Frame'],
          colors: ['Cool Blue', 'Iron Gray'],
          waterResistance: 'IP64',
        },
        software: {
          os: 'Android',
          version: '14',
          updateSupport: '4 years',
        },
      },
      images: ['image3.jpg', 'image4.jpg'],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    };
  });

  describe('comparePhones', () => {
    it('should successfully compare two different phones', async () => {
      const result = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.phones).toHaveLength(2);
      expect(result.phones[0]).toEqual(mockPhone1);
      expect(result.phones[1]).toEqual(mockPhone2);
      expect(result.categories).toHaveLength(6); // display, camera, performance, battery, build, value
      expect(result.scores.phone1).toBeDefined();
      expect(result.scores.phone2).toBeDefined();
      expect(result.overallWinner).toMatch(/phone1|phone2|tie/);
      expect(result.insights).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when comparing same phone', async () => {
      await expect(comparisonEngine.comparePhones(mockPhone1, mockPhone1))
        .rejects.toThrow('Cannot compare a phone with itself');
    });

    it('should throw error when phone1 is null', async () => {
      await expect(comparisonEngine.comparePhones(null as any, mockPhone2))
        .rejects.toThrow('Both phones are required for comparison');
    });

    it('should throw error when phone2 is null', async () => {
      await expect(comparisonEngine.comparePhones(mockPhone1, null as any))
        .rejects.toThrow('Both phones are required for comparison');
    });

    it('should generate all required comparison categories', async () => {
      const result = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);
      
      const categoryNames = result.categories.map(cat => cat.name);
      expect(categoryNames).toContain('display');
      expect(categoryNames).toContain('camera');
      expect(categoryNames).toContain('performance');
      expect(categoryNames).toContain('battery');
      expect(categoryNames).toContain('build');
      expect(categoryNames).toContain('value');
    });

    it('should have proper category structure', async () => {
      const result = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);
      
      result.categories.forEach(category => {
        expect(category.name).toBeDefined();
        expect(category.displayName).toBeDefined();
        expect(category.weight).toBeGreaterThan(0);
        expect(category.weight).toBeLessThanOrEqual(1);
        expect(category.comparisons).toBeInstanceOf(Array);
        expect(category.comparisons.length).toBeGreaterThan(0);
        expect(category.winner).toMatch(/phone1|phone2|tie/);
        expect(category.summary).toBeDefined();
      });
    });
  });

  describe('calculateScores', () => {
    it('should calculate scores for a phone', async () => {
      const scores = await comparisonEngine.calculateScores(mockPhone1);

      expect(scores.overall).toBeGreaterThanOrEqual(0);
      expect(scores.overall).toBeLessThanOrEqual(100);
      expect(scores.display).toBeGreaterThanOrEqual(0);
      expect(scores.display).toBeLessThanOrEqual(100);
      expect(scores.camera).toBeGreaterThanOrEqual(0);
      expect(scores.camera).toBeLessThanOrEqual(100);
      expect(scores.performance).toBeGreaterThanOrEqual(0);
      expect(scores.performance).toBeLessThanOrEqual(100);
      expect(scores.battery).toBeGreaterThanOrEqual(0);
      expect(scores.battery).toBeLessThanOrEqual(100);
      expect(scores.build).toBeGreaterThanOrEqual(0);
      expect(scores.build).toBeLessThanOrEqual(100);
      expect(scores.value).toBeGreaterThanOrEqual(0);
      expect(scores.value).toBeLessThanOrEqual(100);
    });

    it('should give higher scores to better specifications', async () => {
      const scores1 = await comparisonEngine.calculateScores(mockPhone1); // High-end phone
      const scores2 = await comparisonEngine.calculateScores(mockPhone2); // Mid-range phone

      // High-end phone should have better camera and performance scores
      expect(scores1.camera).toBeGreaterThan(scores2.camera);
      expect(scores1.performance).toBeGreaterThan(scores2.performance);
      
      // Mid-range phone should have better value score due to lower price
      expect(scores2.value).toBeGreaterThan(scores1.value);
    });

    it('should handle phones with minimal specifications', async () => {
      const minimalPhone: Phone = {
        ...mockPhone1,
        specifications: {
          display: { size: '5.0"', resolution: '720x1280', type: 'LCD' },
          camera: {
            rear: [{ megapixels: 8, features: [] }],
            front: { megapixels: 2, features: [] },
            features: [],
          },
          performance: {
            processor: 'Basic Processor',
            ram: ['2GB'],
            storage: ['32GB'],
          },
          battery: { capacity: 2000 },
          connectivity: { network: ['4G'], wifi: 'Wi-Fi 4', bluetooth: '4.0' },
          build: { dimensions: '', weight: '', materials: ['Plastic'], colors: ['Black'] },
          software: { os: 'Android', version: '10' },
        },
      };

      const scores = await comparisonEngine.calculateScores(minimalPhone);
      
      // Should still return valid scores within range
      expect(scores.overall).toBeGreaterThanOrEqual(0);
      expect(scores.overall).toBeLessThanOrEqual(100);
      expect(scores.display).toBeGreaterThanOrEqual(0);
      expect(scores.camera).toBeGreaterThanOrEqual(0);
      expect(scores.performance).toBeGreaterThanOrEqual(0);
      expect(scores.battery).toBeGreaterThanOrEqual(0);
      expect(scores.build).toBeGreaterThanOrEqual(0);
      expect(scores.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate comprehensive insights', async () => {
      const comparison = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);
      const insights = await comparisonEngine.generateInsights(comparison);

      expect(insights.strengths.phone1).toBeInstanceOf(Array);
      expect(insights.strengths.phone2).toBeInstanceOf(Array);
      expect(insights.weaknesses.phone1).toBeInstanceOf(Array);
      expect(insights.weaknesses.phone2).toBeInstanceOf(Array);
      expect(insights.recommendations).toBeInstanceOf(Array);
      expect(insights.bestFor.phone1).toBeInstanceOf(Array);
      expect(insights.bestFor.phone2).toBeInstanceOf(Array);
    });

    it('should identify strengths correctly', async () => {
      const comparison = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);
      const insights = await comparisonEngine.generateInsights(comparison);

      // Check that strengths are identified appropriately
      expect(insights.strengths.phone1.length).toBeGreaterThanOrEqual(0);
      expect(insights.strengths.phone2.length).toBeGreaterThanOrEqual(0);
      
      // At least one phone should have some strengths
      expect(insights.strengths.phone1.length + insights.strengths.phone2.length).toBeGreaterThan(0);
      
      // High-end phone should have camera strength (it has better camera specs)
      expect(insights.strengths.phone1).toContain('camera performance');
    });

    it('should provide relevant recommendations', async () => {
      const comparison = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);
      const insights = await comparisonEngine.generateInsights(comparison);

      expect(insights.recommendations.length).toBeGreaterThan(0);
      insights.recommendations.forEach(rec => {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      });
    });
  });

  describe('compareMultiplePhones', () => {
    it('should compare multiple phones successfully', async () => {
      const phone3: Phone = { ...mockPhone2, id: 'phone-3', model: 'Different Model' };
      const phones = [mockPhone1, mockPhone2, phone3];
      
      const results = await comparisonEngine.compareMultiplePhones(phones);
      
      // Should generate pairwise comparisons: (1,2), (1,3), (2,3)
      expect(results).toHaveLength(3);
      
      results.forEach(result => {
        expect(result.phones).toHaveLength(2);
        expect(result.categories).toHaveLength(6);
        expect(result.scores.phone1).toBeDefined();
        expect(result.scores.phone2).toBeDefined();
      });
    });

    it('should throw error for insufficient phones', async () => {
      await expect(comparisonEngine.compareMultiplePhones([mockPhone1]))
        .rejects.toThrow('At least 2 phones are required for comparison');
    });

    it('should handle empty array', async () => {
      await expect(comparisonEngine.compareMultiplePhones([]))
        .rejects.toThrow('At least 2 phones are required for comparison');
    });
  });

  describe('Display Scoring', () => {
    it('should score larger displays higher', async () => {
      const smallDisplayPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          display: { ...mockPhone1.specifications.display, size: '5.5"' }
        }
      };
      
      const largeDisplayPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          display: { ...mockPhone1.specifications.display, size: '6.8"' }
        }
      };

      const smallScores = await comparisonEngine.calculateScores(smallDisplayPhone);
      const largeScores = await comparisonEngine.calculateScores(largeDisplayPhone);

      expect(largeScores.display).toBeGreaterThan(smallScores.display);
    });

    it('should score higher resolution displays better', async () => {
      const hdPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          display: { ...mockPhone1.specifications.display, resolution: '720x1280' }
        }
      };
      
      const qhdPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          display: { ...mockPhone1.specifications.display, resolution: '1440x3120' }
        }
      };

      const hdScores = await comparisonEngine.calculateScores(hdPhone);
      const qhdScores = await comparisonEngine.calculateScores(qhdPhone);

      expect(qhdScores.display).toBeGreaterThan(hdScores.display);
    });

    it('should score AMOLED displays higher than LCD', async () => {
      const lcdPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          display: { ...mockPhone1.specifications.display, type: 'IPS LCD' }
        }
      };
      
      const amoledPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          display: { ...mockPhone1.specifications.display, type: 'Dynamic AMOLED' }
        }
      };

      const lcdScores = await comparisonEngine.calculateScores(lcdPhone);
      const amoledScores = await comparisonEngine.calculateScores(amoledPhone);

      expect(amoledScores.display).toBeGreaterThan(lcdScores.display);
    });
  });

  describe('Camera Scoring', () => {
    it('should score higher megapixel cameras better', async () => {
      const lowMpPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          camera: {
            ...mockPhone1.specifications.camera,
            rear: [{ megapixels: 12, features: [] }]
          }
        }
      };
      
      const highMpPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          camera: {
            ...mockPhone1.specifications.camera,
            rear: [{ megapixels: 108, features: [] }]
          }
        }
      };

      const lowScores = await comparisonEngine.calculateScores(lowMpPhone);
      const highScores = await comparisonEngine.calculateScores(highMpPhone);

      expect(highScores.camera).toBeGreaterThan(lowScores.camera);
    });

    it('should give bonus for multiple cameras', async () => {
      const singleCameraPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          camera: {
            ...mockPhone1.specifications.camera,
            rear: [{ megapixels: 50, features: [] }]
          }
        }
      };
      
      const multiCameraPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          camera: {
            ...mockPhone1.specifications.camera,
            rear: [
              { megapixels: 50, features: [] },
              { megapixels: 12, features: [] },
              { megapixels: 8, features: [] },
              { megapixels: 2, features: [] }
            ]
          }
        }
      };

      const singleScores = await comparisonEngine.calculateScores(singleCameraPhone);
      const multiScores = await comparisonEngine.calculateScores(multiCameraPhone);

      expect(multiScores.camera).toBeGreaterThan(singleScores.camera);
    });
  });

  describe('Performance Scoring', () => {
    it('should score flagship processors higher', async () => {
      const midRangePhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          performance: {
            ...mockPhone1.specifications.performance,
            processor: 'Snapdragon 6 Gen 1'
          }
        }
      };
      
      const flagshipPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          performance: {
            ...mockPhone1.specifications.performance,
            processor: 'Snapdragon 8 Gen 3'
          }
        }
      };

      const midScores = await comparisonEngine.calculateScores(midRangePhone);
      const flagshipScores = await comparisonEngine.calculateScores(flagshipPhone);

      expect(flagshipScores.performance).toBeGreaterThan(midScores.performance);
    });

    it('should score higher RAM configurations better', async () => {
      const lowRamPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          performance: {
            ...mockPhone1.specifications.performance,
            ram: ['4GB']
          }
        }
      };
      
      const highRamPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          performance: {
            ...mockPhone1.specifications.performance,
            ram: ['12GB', '16GB']
          }
        }
      };

      const lowScores = await comparisonEngine.calculateScores(lowRamPhone);
      const highScores = await comparisonEngine.calculateScores(highRamPhone);

      expect(highScores.performance).toBeGreaterThan(lowScores.performance);
    });
  });

  describe('Battery Scoring', () => {
    it('should score larger battery capacity higher', async () => {
      const smallBatteryPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          battery: { ...mockPhone1.specifications.battery, capacity: 3000 }
        }
      };
      
      const largeBatteryPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          battery: { ...mockPhone1.specifications.battery, capacity: 5000 }
        }
      };

      const smallScores = await comparisonEngine.calculateScores(smallBatteryPhone);
      const largeScores = await comparisonEngine.calculateScores(largeBatteryPhone);

      expect(largeScores.battery).toBeGreaterThan(smallScores.battery);
    });

    it('should give bonus for fast charging', async () => {
      const slowChargingPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          battery: { ...mockPhone1.specifications.battery, chargingSpeed: 18 }
        }
      };
      
      const fastChargingPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          battery: { ...mockPhone1.specifications.battery, chargingSpeed: 100 }
        }
      };

      const slowScores = await comparisonEngine.calculateScores(slowChargingPhone);
      const fastScores = await comparisonEngine.calculateScores(fastChargingPhone);

      expect(fastScores.battery).toBeGreaterThan(slowScores.battery);
    });

    it('should give bonus for wireless charging', async () => {
      const noWirelessPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          battery: { ...mockPhone1.specifications.battery, wirelessCharging: false }
        }
      };
      
      const wirelessPhone = {
        ...mockPhone1,
        specifications: {
          ...mockPhone1.specifications,
          battery: { ...mockPhone1.specifications.battery, wirelessCharging: true }
        }
      };

      const noWirelessScores = await comparisonEngine.calculateScores(noWirelessPhone);
      const wirelessScores = await comparisonEngine.calculateScores(wirelessPhone);

      expect(wirelessScores.battery).toBeGreaterThan(noWirelessScores.battery);
    });
  });

  describe('Value Scoring', () => {
    it('should score cheaper phones higher for value', async () => {
      const expensivePhone = {
        ...mockPhone1,
        pricing: { ...mockPhone1.pricing, currentPrice: 100000 }
      };
      
      const cheaperPhone = {
        ...mockPhone1,
        pricing: { ...mockPhone1.pricing, currentPrice: 20000 }
      };

      const expensiveScores = await comparisonEngine.calculateScores(expensivePhone);
      const cheaperScores = await comparisonEngine.calculateScores(cheaperPhone);

      expect(cheaperScores.value).toBeGreaterThan(expensiveScores.value);
    });

    it('should score available phones higher than discontinued', async () => {
      const discontinuedPhone = {
        ...mockPhone1,
        availability: 'discontinued' as const
      };
      
      const availablePhone = {
        ...mockPhone1,
        availability: 'available' as const
      };

      const discontinuedScores = await comparisonEngine.calculateScores(discontinuedPhone);
      const availableScores = await comparisonEngine.calculateScores(availablePhone);

      expect(availableScores.value).toBeGreaterThan(discontinuedScores.value);
    });
  });

  describe('Visual Formatting', () => {
    it('should format comparison data for visualization', async () => {
      const comparison = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);
      const visualData = comparisonEngine.formatForVisualization(comparison);

      expect(visualData.phones.phone1.id).toBe(mockPhone1.id);
      expect(visualData.phones.phone1.name).toBe('Samsung Galaxy S24 Ultra');
      expect(visualData.phones.phone1.price).toBe(125000);
      expect(visualData.phones.phone1.overallScore).toBeGreaterThan(0);

      expect(visualData.phones.phone2.id).toBe(mockPhone2.id);
      expect(visualData.phones.phone2.name).toBe('OnePlus 12R');
      expect(visualData.phones.phone2.price).toBe(42000);
      expect(visualData.phones.phone2.overallScore).toBeGreaterThan(0);

      expect(visualData.categories).toHaveLength(6);
      expect(visualData.summary.winner).toMatch(/phone1|phone2|tie/);
      expect(visualData.summary.winnerName).toBeDefined();
      expect(visualData.summary.keyDifferences).toBeInstanceOf(Array);
      expect(visualData.summary.recommendations).toBeInstanceOf(Array);

      expect(visualData.charts.scoreComparison.phone1).toBeDefined();
      expect(visualData.charts.scoreComparison.phone2).toBeDefined();
      expect(visualData.charts.categoryBreakdown).toHaveLength(6);
    });

    it('should extract key differences correctly', async () => {
      const comparison = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);
      const visualData = comparisonEngine.formatForVisualization(comparison);

      // Should identify price difference (125000 vs 42000 = 83000 difference)
      expect(visualData.summary.keyDifferences.some(diff => 
        diff.includes('cheaper')
      )).toBe(true);

      // Should identify camera difference (200MP vs 50MP)
      expect(visualData.summary.keyDifferences.some(diff => 
        diff.includes('camera')
      )).toBe(true);
    });

    it('should format category data correctly', async () => {
      const comparison = await comparisonEngine.comparePhones(mockPhone1, mockPhone2);
      const visualData = comparisonEngine.formatForVisualization(comparison);

      visualData.categories.forEach(category => {
        expect(category.name).toBeDefined();
        expect(category.displayName).toBeDefined();
        expect(category.winner).toMatch(/phone1|phone2|tie/);
        expect(category.phone1Score).toBeGreaterThanOrEqual(0);
        expect(category.phone1Score).toBeLessThanOrEqual(100);
        expect(category.phone2Score).toBeGreaterThanOrEqual(0);
        expect(category.phone2Score).toBeLessThanOrEqual(100);
        expect(category.comparisons).toBeInstanceOf(Array);
        expect(category.comparisons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle phones with missing optional specifications', async () => {
      const phoneWithMissingSpecs: Phone = {
        ...mockPhone1,
        specifications: {
          display: { size: '6.0"', resolution: '1080x2340', type: 'AMOLED' },
          camera: {
            rear: [{ megapixels: 48, features: [] }],
            front: { megapixels: 8, features: [] },
            features: [],
          },
          performance: {
            processor: 'Snapdragon 7 Gen 1',
            ram: ['8GB'],
            storage: ['128GB'],
          },
          battery: { capacity: 4000 },
          connectivity: { network: ['5G'], wifi: 'Wi-Fi 6', bluetooth: '5.0' },
          build: { dimensions: '', weight: '', materials: [], colors: [] },
          software: { os: 'Android', version: '13' },
        },
      };

      const result = await comparisonEngine.comparePhones(phoneWithMissingSpecs, mockPhone2);
      expect(result).toBeDefined();
      expect(result.categories).toHaveLength(6);
    });

    it('should handle comparison of identical specifications', async () => {
      const identicalPhone = { ...mockPhone1, id: 'different-id' };
      
      const result = await comparisonEngine.comparePhones(mockPhone1, identicalPhone);
      expect(result).toBeDefined();
      expect(result.overallWinner).toBe('tie');
    });
  });
});