import { v4 as uuidv4 } from 'uuid';
import { 
  Phone, 
  PhoneScores, 
  PhoneSpecifications 
} from '../types/phone.js';
import { 
  ComparisonResult, 
  ComparisonCategory, 
  ComparisonInsights, 
  SpecComparison, 
  ComparisonWinner 
} from '../types/comparison.js';
import { ComparisonEngine as IComparisonEngine } from '../types/services.js';

/**
 * Phone comparison engine implementation
 * Provides comprehensive phone-to-phone comparison with scoring and insights
 */
export class ComparisonEngine implements IComparisonEngine {
  
  // Category weights for overall scoring
  private readonly categoryWeights = {
    display: 0.20,
    camera: 0.25,
    performance: 0.20,
    battery: 0.15,
    build: 0.10,
    value: 0.10,
  };

  /**
   * Compare two phones and return detailed comparison result
   */
  async comparePhones(phone1: Phone, phone2: Phone): Promise<ComparisonResult> {
    if (!phone1 || !phone2) {
      throw new Error('Both phones are required for comparison');
    }

    if (phone1.id === phone2.id) {
      throw new Error('Cannot compare a phone with itself');
    }

    // Calculate scores for both phones
    const [scores1, scores2] = await Promise.all([
      this.calculateScores(phone1),
      this.calculateScores(phone2),
    ]);

    // Generate comparison categories
    const categories = await this.generateComparisonCategories(phone1, phone2);

    // Determine overall winner
    const overallWinner = this.determineOverallWinner(scores1, scores2);

    // Generate insights
    const insights = await this.generateInsights({
      id: uuidv4(),
      phones: [phone1, phone2],
      categories,
      scores: { phone1: scores1, phone2: scores2 },
      overallWinner,
      insights: {} as ComparisonInsights, // Temporary placeholder
      summary: '',
      generatedAt: new Date(),
    });

    // Generate summary
    const summary = this.generateSummary(phone1, phone2, overallWinner, insights);

    return {
      id: uuidv4(),
      phones: [phone1, phone2],
      categories,
      scores: {
        phone1: scores1,
        phone2: scores2,
      },
      overallWinner,
      insights,
      summary,
      generatedAt: new Date(),
    };
  }

  /**
   * Calculate comprehensive scores for a phone
   */
  async calculateScores(phone: Phone): Promise<PhoneScores> {
    const specs = phone.specifications;
    
    const displayScore = this.calculateDisplayScore(specs);
    const cameraScore = this.calculateCameraScore(specs);
    const performanceScore = this.calculatePerformanceScore(specs);
    const batteryScore = this.calculateBatteryScore(specs);
    const buildScore = this.calculateBuildScore(specs);
    const valueScore = this.calculateValueScore(phone);

    // Calculate weighted overall score
    const overall = Math.round(
      displayScore * this.categoryWeights.display +
      cameraScore * this.categoryWeights.camera +
      performanceScore * this.categoryWeights.performance +
      batteryScore * this.categoryWeights.battery +
      buildScore * this.categoryWeights.build +
      valueScore * this.categoryWeights.value
    );

    return {
      overall: Math.min(100, Math.max(0, overall)),
      display: Math.min(100, Math.max(0, displayScore)),
      camera: Math.min(100, Math.max(0, cameraScore)),
      performance: Math.min(100, Math.max(0, performanceScore)),
      battery: Math.min(100, Math.max(0, batteryScore)),
      build: Math.min(100, Math.max(0, buildScore)),
      value: Math.min(100, Math.max(0, valueScore)),
    };
  }

  /**
   * Generate insights from comparison result
   */
  async generateInsights(comparison: ComparisonResult): Promise<ComparisonInsights> {
    const [phone1, phone2] = comparison.phones;
    const { phone1: scores1, phone2: scores2 } = comparison.scores;

    const insights: ComparisonInsights = {
      strengths: {
        phone1: this.identifyStrengths(phone1, scores1, scores2),
        phone2: this.identifyStrengths(phone2, scores2, scores1),
      },
      weaknesses: {
        phone1: this.identifyWeaknesses(phone1, scores1, scores2),
        phone2: this.identifyWeaknesses(phone2, scores2, scores1),
      },
      recommendations: this.generateRecommendations(phone1, phone2, comparison),
      bestFor: {
        phone1: this.generateBestForScenarios(phone1, scores1, scores2),
        phone2: this.generateBestForScenarios(phone2, scores2, scores1),
      },
    };

    return insights;
  }

  /**
   * Compare multiple phones (more than 2)
   */
  async compareMultiplePhones(phones: Phone[]): Promise<ComparisonResult[]> {
    if (phones.length < 2) {
      throw new Error('At least 2 phones are required for comparison');
    }

    const comparisons: ComparisonResult[] = [];

    // Generate pairwise comparisons
    for (let i = 0; i < phones.length; i++) {
      for (let j = i + 1; j < phones.length; j++) {
        const comparison = await this.comparePhones(phones[i], phones[j]);
        comparisons.push(comparison);
      }
    }

    return comparisons;
  }

  /**
   * Generate comparison categories with detailed spec comparisons
   */
  private async generateComparisonCategories(
    phone1: Phone, 
    phone2: Phone
  ): Promise<ComparisonCategory[]> {
    return [
      await this.generateDisplayCategory(phone1, phone2),
      await this.generateCameraCategory(phone1, phone2),
      await this.generatePerformanceCategory(phone1, phone2),
      await this.generateBatteryCategory(phone1, phone2),
      await this.generateBuildCategory(phone1, phone2),
      await this.generateValueCategory(phone1, phone2),
    ];
  }

  /**
   * Generate display comparison category
   */
  private async generateDisplayCategory(phone1: Phone, phone2: Phone): Promise<ComparisonCategory> {
    const spec1 = phone1.specifications.display;
    const spec2 = phone2.specifications.display;

    const comparisons: SpecComparison[] = [
      {
        category: 'Screen Size',
        phone1Value: spec1.size,
        phone2Value: spec2.size,
        winner: this.compareDisplaySize(spec1.size, spec2.size),
        importance: 'high',
      },
      {
        category: 'Resolution',
        phone1Value: spec1.resolution,
        phone2Value: spec2.resolution,
        winner: this.compareResolution(spec1.resolution, spec2.resolution),
        importance: 'high',
      },
      {
        category: 'Display Type',
        phone1Value: spec1.type,
        phone2Value: spec2.type,
        winner: this.compareDisplayType(spec1.type, spec2.type),
        importance: 'medium',
      },
      {
        category: 'Refresh Rate',
        phone1Value: spec1.refreshRate ? `${spec1.refreshRate}Hz` : 'Standard',
        phone2Value: spec2.refreshRate ? `${spec2.refreshRate}Hz` : 'Standard',
        winner: this.compareRefreshRate(spec1.refreshRate, spec2.refreshRate),
        importance: 'medium',
      },
    ];

    const winner = this.determineCategoryWinner(comparisons);

    return {
      name: 'display',
      displayName: 'Display',
      weight: this.categoryWeights.display,
      comparisons,
      winner,
      summary: this.generateCategorySummary('display', winner, phone1, phone2),
    };
  }

  /**
   * Generate camera comparison category
   */
  private async generateCameraCategory(phone1: Phone, phone2: Phone): Promise<ComparisonCategory> {
    const spec1 = phone1.specifications.camera;
    const spec2 = phone2.specifications.camera;

    const comparisons: SpecComparison[] = [
      {
        category: 'Main Camera',
        phone1Value: this.formatCameraSpec(spec1.rear[0]),
        phone2Value: this.formatCameraSpec(spec2.rear[0]),
        winner: this.compareCameraSpecs(spec1.rear[0], spec2.rear[0]),
        importance: 'high',
      },
      {
        category: 'Front Camera',
        phone1Value: this.formatCameraSpec(spec1.front),
        phone2Value: this.formatCameraSpec(spec2.front),
        winner: this.compareCameraSpecs(spec1.front, spec2.front),
        importance: 'medium',
      },
      {
        category: 'Camera Count',
        phone1Value: `${spec1.rear.length} cameras`,
        phone2Value: `${spec2.rear.length} cameras`,
        winner: spec1.rear.length > spec2.rear.length ? 'phone1' : 
                spec2.rear.length > spec1.rear.length ? 'phone2' : 'tie',
        importance: 'low',
      },
    ];

    const winner = this.determineCategoryWinner(comparisons);

    return {
      name: 'camera',
      displayName: 'Camera',
      weight: this.categoryWeights.camera,
      comparisons,
      winner,
      summary: this.generateCategorySummary('camera', winner, phone1, phone2),
    };
  }

  /**
   * Generate performance comparison category
   */
  private async generatePerformanceCategory(phone1: Phone, phone2: Phone): Promise<ComparisonCategory> {
    const spec1 = phone1.specifications.performance;
    const spec2 = phone2.specifications.performance;

    const comparisons: SpecComparison[] = [
      {
        category: 'Processor',
        phone1Value: spec1.processor,
        phone2Value: spec2.processor,
        winner: this.compareProcessors(spec1.processor, spec2.processor),
        importance: 'high',
      },
      {
        category: 'RAM Options',
        phone1Value: spec1.ram.join(', '),
        phone2Value: spec2.ram.join(', '),
        winner: this.compareRAM(spec1.ram, spec2.ram),
        importance: 'high',
      },
      {
        category: 'Storage Options',
        phone1Value: spec1.storage.join(', '),
        phone2Value: spec2.storage.join(', '),
        winner: this.compareStorage(spec1.storage, spec2.storage),
        importance: 'medium',
      },
    ];

    const winner = this.determineCategoryWinner(comparisons);

    return {
      name: 'performance',
      displayName: 'Performance',
      weight: this.categoryWeights.performance,
      comparisons,
      winner,
      summary: this.generateCategorySummary('performance', winner, phone1, phone2),
    };
  }

  /**
   * Generate battery comparison category
   */
  private async generateBatteryCategory(phone1: Phone, phone2: Phone): Promise<ComparisonCategory> {
    const spec1 = phone1.specifications.battery;
    const spec2 = phone2.specifications.battery;

    const comparisons: SpecComparison[] = [
      {
        category: 'Battery Capacity',
        phone1Value: `${spec1.capacity}mAh`,
        phone2Value: `${spec2.capacity}mAh`,
        winner: spec1.capacity > spec2.capacity ? 'phone1' : 
                spec2.capacity > spec1.capacity ? 'phone2' : 'tie',
        importance: 'high',
      },
      {
        category: 'Charging Speed',
        phone1Value: spec1.chargingSpeed ? `${spec1.chargingSpeed}W` : 'Standard',
        phone2Value: spec2.chargingSpeed ? `${spec2.chargingSpeed}W` : 'Standard',
        winner: this.compareChargingSpeed(spec1.chargingSpeed, spec2.chargingSpeed),
        importance: 'medium',
      },
      {
        category: 'Wireless Charging',
        phone1Value: spec1.wirelessCharging ? 'Yes' : 'No',
        phone2Value: spec2.wirelessCharging ? 'Yes' : 'No',
        winner: spec1.wirelessCharging && !spec2.wirelessCharging ? 'phone1' :
                !spec1.wirelessCharging && spec2.wirelessCharging ? 'phone2' : 'tie',
        importance: 'low',
      },
    ];

    const winner = this.determineCategoryWinner(comparisons);

    return {
      name: 'battery',
      displayName: 'Battery',
      weight: this.categoryWeights.battery,
      comparisons,
      winner,
      summary: this.generateCategorySummary('battery', winner, phone1, phone2),
    };
  }

  /**
   * Generate build comparison category
   */
  private async generateBuildCategory(phone1: Phone, phone2: Phone): Promise<ComparisonCategory> {
    const spec1 = phone1.specifications.build;
    const spec2 = phone2.specifications.build;

    const comparisons: SpecComparison[] = [
      {
        category: 'Materials',
        phone1Value: spec1.materials.join(', '),
        phone2Value: spec2.materials.join(', '),
        winner: this.compareMaterials(spec1.materials, spec2.materials),
        importance: 'medium',
      },
      {
        category: 'Water Resistance',
        phone1Value: spec1.waterResistance || 'None',
        phone2Value: spec2.waterResistance || 'None',
        winner: this.compareWaterResistance(spec1.waterResistance, spec2.waterResistance),
        importance: 'medium',
      },
      {
        category: 'Color Options',
        phone1Value: `${spec1.colors.length} colors`,
        phone2Value: `${spec2.colors.length} colors`,
        winner: spec1.colors.length > spec2.colors.length ? 'phone1' :
                spec2.colors.length > spec1.colors.length ? 'phone2' : 'tie',
        importance: 'low',
      },
    ];

    const winner = this.determineCategoryWinner(comparisons);

    return {
      name: 'build',
      displayName: 'Build Quality',
      weight: this.categoryWeights.build,
      comparisons,
      winner,
      summary: this.generateCategorySummary('build', winner, phone1, phone2),
    };
  }

  /**
   * Generate value comparison category
   */
  private async generateValueCategory(phone1: Phone, phone2: Phone): Promise<ComparisonCategory> {
    const comparisons: SpecComparison[] = [
      {
        category: 'Price',
        phone1Value: `₹${phone1.pricing.currentPrice.toLocaleString()}`,
        phone2Value: `₹${phone2.pricing.currentPrice.toLocaleString()}`,
        winner: phone1.pricing.currentPrice < phone2.pricing.currentPrice ? 'phone1' :
                phone2.pricing.currentPrice < phone1.pricing.currentPrice ? 'phone2' : 'tie',
        importance: 'high',
      },
      {
        category: 'Availability',
        phone1Value: phone1.availability,
        phone2Value: phone2.availability,
        winner: this.compareAvailability(phone1.availability, phone2.availability),
        importance: 'medium',
      },
    ];

    const winner = this.determineCategoryWinner(comparisons);

    return {
      name: 'value',
      displayName: 'Value for Money',
      weight: this.categoryWeights.value,
      comparisons,
      winner,
      summary: this.generateCategorySummary('value', winner, phone1, phone2),
    };
  }

  // Scoring methods for individual categories
  private calculateDisplayScore(specs: PhoneSpecifications): number {
    let score = 50; // Base score

    // Screen size scoring
    const sizeMatch = specs.display.size.match(/(\d+\.?\d*)/);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      if (size >= 6.5) score += 15;
      else if (size >= 6.0) score += 10;
      else if (size >= 5.5) score += 5;
    }

    // Resolution scoring
    if (specs.display.resolution.includes('1440') || specs.display.resolution.includes('QHD')) {
      score += 20;
    } else if (specs.display.resolution.includes('1080') || specs.display.resolution.includes('FHD')) {
      score += 15;
    } else if (specs.display.resolution.includes('720') || specs.display.resolution.includes('HD')) {
      score += 5;
    }

    // Display type scoring
    if (specs.display.type.toLowerCase().includes('amoled') || 
        specs.display.type.toLowerCase().includes('oled')) {
      score += 10;
    } else if (specs.display.type.toLowerCase().includes('ips')) {
      score += 5;
    }

    // Refresh rate scoring
    if (specs.display.refreshRate) {
      if (specs.display.refreshRate >= 120) score += 5;
      else if (specs.display.refreshRate >= 90) score += 3;
    }

    return score;
  }

  private calculateCameraScore(specs: PhoneSpecifications): number {
    let score = 40; // Base score

    // Main camera scoring
    if (specs.camera.rear.length > 0) {
      const mainCamera = specs.camera.rear[0];
      if (mainCamera.megapixels >= 108) score += 20;
      else if (mainCamera.megapixels >= 64) score += 15;
      else if (mainCamera.megapixels >= 48) score += 10;
      else if (mainCamera.megapixels >= 12) score += 5;
    }

    // Front camera scoring
    if (specs.camera.front.megapixels >= 32) score += 10;
    else if (specs.camera.front.megapixels >= 16) score += 7;
    else if (specs.camera.front.megapixels >= 8) score += 5;

    // Multiple cameras bonus
    if (specs.camera.rear.length >= 4) score += 10;
    else if (specs.camera.rear.length >= 3) score += 7;
    else if (specs.camera.rear.length >= 2) score += 5;

    // Camera features bonus
    score += Math.min(10, specs.camera.features.length * 2);

    return score;
  }

  private calculatePerformanceScore(specs: PhoneSpecifications): number {
    let score = 40; // Base score

    // Processor scoring (simplified - in real implementation, would use benchmark data)
    const processor = specs.performance.processor.toLowerCase();
    if (processor.includes('snapdragon 8') || processor.includes('a17') || processor.includes('a16')) {
      score += 25;
    } else if (processor.includes('snapdragon 7') || processor.includes('a15') || processor.includes('dimensity 9')) {
      score += 20;
    } else if (processor.includes('snapdragon 6') || processor.includes('dimensity 8')) {
      score += 15;
    } else if (processor.includes('snapdragon 4') || processor.includes('dimensity 7')) {
      score += 10;
    }

    // RAM scoring
    const maxRAM = this.extractMaxRAM(specs.performance.ram);
    if (maxRAM >= 12) score += 15;
    else if (maxRAM >= 8) score += 10;
    else if (maxRAM >= 6) score += 7;
    else if (maxRAM >= 4) score += 5;

    // Storage scoring
    const maxStorage = this.extractMaxStorage(specs.performance.storage);
    if (maxStorage >= 512) score += 10;
    else if (maxStorage >= 256) score += 7;
    else if (maxStorage >= 128) score += 5;

    return score;
  }

  private calculateBatteryScore(specs: PhoneSpecifications): number {
    let score = 40; // Base score

    // Battery capacity scoring
    if (specs.battery.capacity >= 5000) score += 25;
    else if (specs.battery.capacity >= 4500) score += 20;
    else if (specs.battery.capacity >= 4000) score += 15;
    else if (specs.battery.capacity >= 3500) score += 10;
    else if (specs.battery.capacity >= 3000) score += 5;

    // Charging speed scoring
    if (specs.battery.chargingSpeed) {
      if (specs.battery.chargingSpeed >= 100) score += 15;
      else if (specs.battery.chargingSpeed >= 65) score += 12;
      else if (specs.battery.chargingSpeed >= 33) score += 8;
      else if (specs.battery.chargingSpeed >= 18) score += 5;
    }

    // Wireless charging bonus
    if (specs.battery.wirelessCharging) score += 10;

    return score;
  }

  private calculateBuildScore(specs: PhoneSpecifications): number {
    let score = 50; // Base score

    // Materials scoring
    const materials = specs.build.materials.join(' ').toLowerCase();
    if (materials.includes('glass') && materials.includes('metal')) score += 20;
    else if (materials.includes('glass') || materials.includes('metal')) score += 15;
    else if (materials.includes('premium')) score += 10;

    // Water resistance scoring
    if (specs.build.waterResistance) {
      const rating = specs.build.waterResistance.toLowerCase();
      if (rating.includes('ip68')) score += 15;
      else if (rating.includes('ip67')) score += 12;
      else if (rating.includes('ip65') || rating.includes('ip54')) score += 8;
    }

    // Color options bonus
    score += Math.min(15, specs.build.colors.length * 2);

    return score;
  }

  private calculateValueScore(phone: Phone): number {
    let score = 50; // Base score

    // Price-based scoring (relative to market segments)
    const price = phone.pricing.currentPrice;
    if (price < 15000) score += 20; // Budget segment
    else if (price < 30000) score += 15; // Mid-range
    else if (price < 50000) score += 10; // Premium
    else score += 5; // Flagship

    // Availability scoring
    if (phone.availability === 'available') score += 20;
    else if (phone.availability === 'upcoming') score += 10;
    else score -= 10; // discontinued

    // Launch date relevance (newer phones get bonus)
    const monthsOld = (Date.now() - phone.launchDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld < 6) score += 10;
    else if (monthsOld < 12) score += 5;
    else if (monthsOld > 24) score -= 5;

    return score;
  }

  // Helper methods for comparisons
  private compareDisplaySize(size1: string, size2: string): ComparisonWinner {
    const num1 = this.extractNumber(size1);
    const num2 = this.extractNumber(size2);
    if (num1 > num2) return 'phone1';
    if (num2 > num1) return 'phone2';
    return 'tie';
  }

  private compareResolution(res1: string, res2: string): ComparisonWinner {
    const score1 = this.getResolutionScore(res1);
    const score2 = this.getResolutionScore(res2);
    if (score1 > score2) return 'phone1';
    if (score2 > score1) return 'phone2';
    return 'tie';
  }

  private compareDisplayType(type1: string, type2: string): ComparisonWinner {
    const score1 = this.getDisplayTypeScore(type1);
    const score2 = this.getDisplayTypeScore(type2);
    if (score1 > score2) return 'phone1';
    if (score2 > score1) return 'phone2';
    return 'tie';
  }

  private compareRefreshRate(rate1?: number, rate2?: number): ComparisonWinner {
    const r1 = rate1 || 60;
    const r2 = rate2 || 60;
    if (r1 > r2) return 'phone1';
    if (r2 > r1) return 'phone2';
    return 'tie';
  }

  private compareCameraSpecs(cam1: any, cam2: any): ComparisonWinner {
    if (!cam1 && !cam2) return 'tie';
    if (!cam1) return 'phone2';
    if (!cam2) return 'phone1';
    
    if (cam1.megapixels > cam2.megapixels) return 'phone1';
    if (cam2.megapixels > cam1.megapixels) return 'phone2';
    return 'tie';
  }

  private compareProcessors(proc1: string, proc2: string): ComparisonWinner {
    const score1 = this.getProcessorScore(proc1);
    const score2 = this.getProcessorScore(proc2);
    if (score1 > score2) return 'phone1';
    if (score2 > score1) return 'phone2';
    return 'tie';
  }

  private compareRAM(ram1: string[], ram2: string[]): ComparisonWinner {
    const max1 = this.extractMaxRAM(ram1);
    const max2 = this.extractMaxRAM(ram2);
    if (max1 > max2) return 'phone1';
    if (max2 > max1) return 'phone2';
    return 'tie';
  }

  private compareStorage(storage1: string[], storage2: string[]): ComparisonWinner {
    const max1 = this.extractMaxStorage(storage1);
    const max2 = this.extractMaxStorage(storage2);
    if (max1 > max2) return 'phone1';
    if (max2 > max1) return 'phone2';
    return 'tie';
  }

  private compareChargingSpeed(speed1?: number, speed2?: number): ComparisonWinner {
    const s1 = speed1 || 0;
    const s2 = speed2 || 0;
    if (s1 > s2) return 'phone1';
    if (s2 > s1) return 'phone2';
    return 'tie';
  }

  private compareMaterials(materials1: string[], materials2: string[]): ComparisonWinner {
    const score1 = this.getMaterialsScore(materials1);
    const score2 = this.getMaterialsScore(materials2);
    if (score1 > score2) return 'phone1';
    if (score2 > score1) return 'phone2';
    return 'tie';
  }

  private compareWaterResistance(rating1?: string, rating2?: string): ComparisonWinner {
    const score1 = this.getWaterResistanceScore(rating1);
    const score2 = this.getWaterResistanceScore(rating2);
    if (score1 > score2) return 'phone1';
    if (score2 > score1) return 'phone2';
    return 'tie';
  }

  private compareAvailability(avail1: string, avail2: string): ComparisonWinner {
    const score1 = this.getAvailabilityScore(avail1);
    const score2 = this.getAvailabilityScore(avail2);
    if (score1 > score2) return 'phone1';
    if (score2 > score1) return 'phone2';
    return 'tie';
  }

  // Utility methods
  private extractNumber(str: string): number {
    const match = str.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractMaxRAM(ramOptions: string[]): number {
    return Math.max(...ramOptions.map(ram => this.extractNumber(ram)));
  }

  private extractMaxStorage(storageOptions: string[]): number {
    return Math.max(...storageOptions.map(storage => this.extractNumber(storage)));
  }

  private getResolutionScore(resolution: string): number {
    const res = resolution.toLowerCase();
    if (res.includes('1440') || res.includes('qhd')) return 4;
    if (res.includes('1080') || res.includes('fhd')) return 3;
    if (res.includes('720') || res.includes('hd')) return 2;
    return 1;
  }

  private getDisplayTypeScore(type: string): number {
    const t = type.toLowerCase();
    if (t.includes('amoled') || t.includes('oled')) return 3;
    if (t.includes('ips')) return 2;
    return 1;
  }

  private getProcessorScore(processor: string): number {
    const proc = processor.toLowerCase();
    if (proc.includes('snapdragon 8') || proc.includes('a17') || proc.includes('a16')) return 5;
    if (proc.includes('snapdragon 7') || proc.includes('a15') || proc.includes('dimensity 9')) return 4;
    if (proc.includes('snapdragon 6') || proc.includes('dimensity 8')) return 3;
    if (proc.includes('snapdragon 4') || proc.includes('dimensity 7')) return 2;
    return 1;
  }

  private getMaterialsScore(materials: string[]): number {
    const materialsStr = materials.join(' ').toLowerCase();
    if (materialsStr.includes('glass') && materialsStr.includes('metal')) return 3;
    if (materialsStr.includes('glass') || materialsStr.includes('metal')) return 2;
    return 1;
  }

  private getWaterResistanceScore(rating?: string): number {
    if (!rating) return 0;
    const r = rating.toLowerCase();
    if (r.includes('ip68')) return 4;
    if (r.includes('ip67')) return 3;
    if (r.includes('ip65') || r.includes('ip54')) return 2;
    return 1;
  }

  private getAvailabilityScore(availability: string): number {
    switch (availability) {
      case 'available': return 3;
      case 'upcoming': return 2;
      case 'discontinued': return 1;
      default: return 0;
    }
  }

  private formatCameraSpec(camera: any): string {
    if (!camera) return 'N/A';
    return `${camera.megapixels}MP${camera.aperture ? ` f/${camera.aperture}` : ''}`;
  }

  private determineCategoryWinner(comparisons: SpecComparison[]): ComparisonWinner {
    let phone1Wins = 0;
    let phone2Wins = 0;
    let totalWeight = 0;

    comparisons.forEach(comp => {
      const weight = comp.importance === 'high' ? 3 : comp.importance === 'medium' ? 2 : 1;
      totalWeight += weight;
      
      if (comp.winner === 'phone1') phone1Wins += weight;
      else if (comp.winner === 'phone2') phone2Wins += weight;
    });

    if (phone1Wins > phone2Wins) return 'phone1';
    if (phone2Wins > phone1Wins) return 'phone2';
    return 'tie';
  }

  private determineOverallWinner(scores1: PhoneScores, scores2: PhoneScores): ComparisonWinner {
    if (scores1.overall > scores2.overall) return 'phone1';
    if (scores2.overall > scores1.overall) return 'phone2';
    return 'tie';
  }

  private generateCategorySummary(
    category: string, 
    winner: ComparisonWinner, 
    phone1: Phone, 
    phone2: Phone
  ): string {
    const phone1Name = `${phone1.brand} ${phone1.model}`;
    const phone2Name = `${phone2.brand} ${phone2.model}`;

    switch (winner) {
      case 'phone1':
        return `${phone1Name} has better ${category} specifications.`;
      case 'phone2':
        return `${phone2Name} has better ${category} specifications.`;
      default:
        return `Both phones have comparable ${category} specifications.`;
    }
  }

  private generateSummary(
    phone1: Phone, 
    phone2: Phone, 
    winner: ComparisonWinner, 
    insights: ComparisonInsights
  ): string {
    const phone1Name = `${phone1.brand} ${phone1.model}`;
    const phone2Name = `${phone2.brand} ${phone2.model}`;

    let summary = `Comparison between ${phone1Name} and ${phone2Name}. `;

    switch (winner) {
      case 'phone1':
        summary += `${phone1Name} comes out ahead overall with strengths in ${insights.strengths.phone1.slice(0, 2).join(' and ')}.`;
        break;
      case 'phone2':
        summary += `${phone2Name} takes the lead overall with advantages in ${insights.strengths.phone2.slice(0, 2).join(' and ')}.`;
        break;
      default:
        summary += `Both phones are very competitive with each having their own strengths.`;
    }

    return summary;
  }

  private identifyStrengths(phone: Phone, ownScores: PhoneScores, competitorScores: PhoneScores): string[] {
    const strengths: string[] = [];
    
    if (ownScores.display > competitorScores.display + 5) strengths.push('display quality');
    if (ownScores.camera > competitorScores.camera + 5) strengths.push('camera performance');
    if (ownScores.performance > competitorScores.performance + 5) strengths.push('processing power');
    if (ownScores.battery > competitorScores.battery + 5) strengths.push('battery life');
    if (ownScores.build > competitorScores.build + 5) strengths.push('build quality');
    if (ownScores.value > competitorScores.value + 5) strengths.push('value for money');

    return strengths;
  }

  private identifyWeaknesses(phone: Phone, ownScores: PhoneScores, competitorScores: PhoneScores): string[] {
    const weaknesses: string[] = [];
    
    if (ownScores.display < competitorScores.display - 5) weaknesses.push('display quality');
    if (ownScores.camera < competitorScores.camera - 5) weaknesses.push('camera performance');
    if (ownScores.performance < competitorScores.performance - 5) weaknesses.push('processing power');
    if (ownScores.battery < competitorScores.battery - 5) weaknesses.push('battery life');
    if (ownScores.build < competitorScores.build - 5) weaknesses.push('build quality');
    if (ownScores.value < competitorScores.value - 5) weaknesses.push('value for money');

    return weaknesses;
  }

  private generateRecommendations(phone1: Phone, phone2: Phone, comparison: ComparisonResult): string[] {
    const recommendations: string[] = [];
    const { phone1: scores1, phone2: scores2 } = comparison.scores;
    
    const phone1Name = `${phone1.brand} ${phone1.model}`;
    const phone2Name = `${phone2.brand} ${phone2.model}`;

    // Price-based recommendations
    if (phone1.pricing.currentPrice < phone2.pricing.currentPrice * 0.8) {
      recommendations.push(`${phone1Name} offers better value for money at ₹${phone1.pricing.currentPrice.toLocaleString()}`);
    } else if (phone2.pricing.currentPrice < phone1.pricing.currentPrice * 0.8) {
      recommendations.push(`${phone2Name} offers better value for money at ₹${phone2.pricing.currentPrice.toLocaleString()}`);
    }

    // Performance recommendations
    if (scores1.performance > scores2.performance + 10) {
      recommendations.push(`Choose ${phone1Name} for better performance and gaming`);
    } else if (scores2.performance > scores1.performance + 10) {
      recommendations.push(`Choose ${phone2Name} for better performance and gaming`);
    }

    // Camera recommendations
    if (scores1.camera > scores2.camera + 10) {
      recommendations.push(`${phone1Name} is better for photography enthusiasts`);
    } else if (scores2.camera > scores1.camera + 10) {
      recommendations.push(`${phone2Name} is better for photography enthusiasts`);
    }

    return recommendations;
  }

  private generateBestForScenarios(phone: Phone, ownScores: PhoneScores, competitorScores: PhoneScores): string[] {
    const scenarios: string[] = [];
    
    if (ownScores.camera > competitorScores.camera + 5) {
      scenarios.push('Photography and content creation');
    }
    
    if (ownScores.performance > competitorScores.performance + 5) {
      scenarios.push('Gaming and heavy multitasking');
    }
    
    if (ownScores.battery > competitorScores.battery + 5) {
      scenarios.push('Long usage sessions and travel');
    }
    
    if (ownScores.value > competitorScores.value + 5) {
      scenarios.push('Budget-conscious buyers');
    }
    
    if (ownScores.display > competitorScores.display + 5) {
      scenarios.push('Media consumption and streaming');
    }

    return scenarios;
  }

  /**
   * Format comparison data for visual consumption by frontend
   */
  formatForVisualization(comparison: ComparisonResult): VisualComparisonData {
    const [phone1, phone2] = comparison.phones;
    
    return {
      phones: {
        phone1: {
          id: phone1.id,
          name: `${phone1.brand} ${phone1.model}`,
          image: phone1.images[0] || '',
          price: phone1.pricing.currentPrice,
          overallScore: comparison.scores.phone1.overall,
        },
        phone2: {
          id: phone2.id,
          name: `${phone2.brand} ${phone2.model}`,
          image: phone2.images[0] || '',
          price: phone2.pricing.currentPrice,
          overallScore: comparison.scores.phone2.overall,
        },
      },
      categories: comparison.categories.map(category => ({
        name: category.name,
        displayName: category.displayName,
        winner: category.winner,
        phone1Score: this.getCategoryScore(comparison.scores.phone1, category.name),
        phone2Score: this.getCategoryScore(comparison.scores.phone2, category.name),
        comparisons: category.comparisons.map(comp => ({
          label: comp.category,
          phone1Value: comp.phone1Value,
          phone2Value: comp.phone2Value,
          winner: comp.winner,
          importance: comp.importance,
        })),
      })),
      summary: {
        winner: comparison.overallWinner,
        winnerName: comparison.overallWinner === 'phone1' 
          ? `${phone1.brand} ${phone1.model}`
          : comparison.overallWinner === 'phone2'
          ? `${phone2.brand} ${phone2.model}`
          : 'Tie',
        keyDifferences: this.extractKeyDifferences(comparison),
        recommendations: comparison.insights.recommendations,
      },
      charts: {
        scoreComparison: {
          phone1: comparison.scores.phone1,
          phone2: comparison.scores.phone2,
        },
        categoryBreakdown: comparison.categories.map(cat => ({
          category: cat.displayName,
          phone1: this.getCategoryScore(comparison.scores.phone1, cat.name),
          phone2: this.getCategoryScore(comparison.scores.phone2, cat.name),
        })),
      },
    };
  }

  /**
   * Get category score from phone scores
   */
  private getCategoryScore(scores: PhoneScores, categoryName: string): number {
    switch (categoryName) {
      case 'display': return scores.display;
      case 'camera': return scores.camera;
      case 'performance': return scores.performance;
      case 'battery': return scores.battery;
      case 'build': return scores.build;
      case 'value': return scores.value;
      default: return 0;
    }
  }

  /**
   * Extract key differences for summary
   */
  private extractKeyDifferences(comparison: ComparisonResult): string[] {
    const differences: string[] = [];
    const [phone1, phone2] = comparison.phones;
    
    // Price difference
    const priceDiff = Math.abs(phone1.pricing.currentPrice - phone2.pricing.currentPrice);
    if (priceDiff > 10000) {
      const cheaper = phone1.pricing.currentPrice < phone2.pricing.currentPrice ? phone1 : phone2;
      differences.push(`${cheaper.brand} ${cheaper.model} is ₹${priceDiff.toLocaleString()} cheaper`);
    }
    
    // Camera differences
    const mainCamera1 = phone1.specifications.camera.rear[0]?.megapixels || 0;
    const mainCamera2 = phone2.specifications.camera.rear[0]?.megapixels || 0;
    if (Math.abs(mainCamera1 - mainCamera2) > 20) {
      const better = mainCamera1 > mainCamera2 ? phone1 : phone2;
      differences.push(`${better.brand} ${better.model} has significantly better main camera`);
    }
    
    // Battery differences
    const batteryDiff = Math.abs(phone1.specifications.battery.capacity - phone2.specifications.battery.capacity);
    if (batteryDiff > 500) {
      const better = phone1.specifications.battery.capacity > phone2.specifications.battery.capacity ? phone1 : phone2;
      differences.push(`${better.brand} ${better.model} has ${batteryDiff}mAh larger battery`);
    }
    
    return differences.slice(0, 3); // Limit to top 3 differences
  }
}

/**
 * Visual comparison data interface for frontend consumption
 */
export interface VisualComparisonData {
  phones: {
    phone1: {
      id: string;
      name: string;
      image: string;
      price: number;
      overallScore: number;
    };
    phone2: {
      id: string;
      name: string;
      image: string;
      price: number;
      overallScore: number;
    };
  };
  categories: Array<{
    name: string;
    displayName: string;
    winner: ComparisonWinner;
    phone1Score: number;
    phone2Score: number;
    comparisons: Array<{
      label: string;
      phone1Value: any;
      phone2Value: any;
      winner: ComparisonWinner;
      importance: 'high' | 'medium' | 'low';
    }>;
  }>;
  summary: {
    winner: ComparisonWinner;
    winnerName: string;
    keyDifferences: string[];
    recommendations: string[];
  };
  charts: {
    scoreComparison: {
      phone1: PhoneScores;
      phone2: PhoneScores;
    };
    categoryBreakdown: Array<{
      category: string;
      phone1: number;
      phone2: number;
    }>;
  };
}

// Export singleton instance
export const comparisonEngine = new ComparisonEngine();
