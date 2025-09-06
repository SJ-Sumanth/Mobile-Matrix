import { z } from 'zod';
import { Phone, PhoneSpecifications, PhoneSchema } from '../../types/phone.js';

// GSMArena API response schemas
const GSMArenaPhoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  launch_date: z.string().optional(),
  status: z.enum(['available', 'discontinued', 'upcoming']).optional(),
  specifications: z.object({
    display: z.object({
      size: z.string().optional(),
      resolution: z.string().optional(),
      type: z.string().optional(),
      refresh_rate: z.number().optional(),
      brightness: z.number().optional(),
    }).optional(),
    camera: z.object({
      main: z.string().optional(),
      ultrawide: z.string().optional(),
      telephoto: z.string().optional(),
      depth: z.string().optional(),
      front: z.string().optional(),
      features: z.array(z.string()).optional(),
    }).optional(),
    performance: z.object({
      chipset: z.string().optional(),
      cpu: z.string().optional(),
      gpu: z.string().optional(),
      ram: z.array(z.string()).optional(),
      storage: z.array(z.string()).optional(),
      card_slot: z.boolean().optional(),
    }).optional(),
    battery: z.object({
      capacity: z.number().optional(),
      charging: z.number().optional(),
      wireless: z.boolean().optional(),
    }).optional(),
    connectivity: z.object({
      network: z.array(z.string()).optional(),
      wifi: z.string().optional(),
      bluetooth: z.string().optional(),
      nfc: z.boolean().optional(),
    }).optional(),
    build: z.object({
      dimensions: z.string().optional(),
      weight: z.string().optional(),
      materials: z.array(z.string()).optional(),
      colors: z.array(z.string()).optional(),
      ip_rating: z.string().optional(),
    }).optional(),
    software: z.object({
      os: z.string().optional(),
      version: z.string().optional(),
    }).optional(),
  }).optional(),
  images: z.array(z.string()).optional(),
  price: z.object({
    currency: z.string().optional(),
    price: z.number().optional(),
  }).optional(),
});

type GSMArenaPhone = z.infer<typeof GSMArenaPhoneSchema>;

export interface GSMArenaConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export class GSMArenaService {
  private config: GSMArenaConfig;
  private rateLimitDelay = 1000; // 1 second between requests

  constructor(config: GSMArenaConfig) {
    this.config = config;
  }

  /**
   * Search phones by brand and model
   */
  async searchPhones(query: string): Promise<GSMArenaPhone[]> {
    try {
      const response = await this.makeRequest(`/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!Array.isArray(data.phones)) {
        throw new Error('Invalid response format from GSMArena API');
      }

      return data.phones.map((phone: any) => this.validateAndParsePhone(phone));
    } catch (error) {
      console.error('Error searching phones from GSMArena:', error);
      throw new Error(`GSMArena search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get phone details by ID
   */
  async getPhoneById(id: string): Promise<GSMArenaPhone | null> {
    try {
      const response = await this.makeRequest(`/phones/${id}`);
      const data = await response.json();
      
      if (!data.phone) {
        return null;
      }

      return this.validateAndParsePhone(data.phone);
    } catch (error) {
      console.error(`Error getting phone ${id} from GSMArena:`, error);
      return null;
    }
  }

  /**
   * Get phones by brand
   */
  async getPhonesByBrand(brand: string): Promise<GSMArenaPhone[]> {
    try {
      const response = await this.makeRequest(`/brands/${encodeURIComponent(brand)}/phones`);
      const data = await response.json();
      
      if (!Array.isArray(data.phones)) {
        throw new Error('Invalid response format from GSMArena API');
      }

      return data.phones.map((phone: any) => this.validateAndParsePhone(phone));
    } catch (error) {
      console.error(`Error getting phones for brand ${brand} from GSMArena:`, error);
      throw new Error(`GSMArena brand search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available brands
   */
  async getBrands(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/brands');
      const data = await response.json();
      
      if (!Array.isArray(data.brands)) {
        throw new Error('Invalid response format from GSMArena API');
      }

      return data.brands.map((brand: any) => brand.name).filter(Boolean);
    } catch (error) {
      console.error('Error getting brands from GSMArena:', error);
      throw new Error(`GSMArena brands fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert GSMArena phone data to our Phone format
   */
  convertToPhone(gsmarenaPhone: GSMArenaPhone): Partial<Phone> {
    const specifications: PhoneSpecifications = {
      display: {
        size: gsmarenaPhone.specifications?.display?.size || '',
        resolution: gsmarenaPhone.specifications?.display?.resolution || '',
        type: gsmarenaPhone.specifications?.display?.type || '',
        refreshRate: gsmarenaPhone.specifications?.display?.refresh_rate,
        brightness: gsmarenaPhone.specifications?.display?.brightness,
      },
      camera: {
        rear: this.parseCameraSpecs([
          gsmarenaPhone.specifications?.camera?.main,
          gsmarenaPhone.specifications?.camera?.ultrawide,
          gsmarenaPhone.specifications?.camera?.telephoto,
          gsmarenaPhone.specifications?.camera?.depth,
        ].filter(Boolean) as string[]),
        front: this.parseCameraSpec(gsmarenaPhone.specifications?.camera?.front || ''),
        features: gsmarenaPhone.specifications?.camera?.features || [],
      },
      performance: {
        processor: gsmarenaPhone.specifications?.performance?.chipset || '',
        gpu: gsmarenaPhone.specifications?.performance?.gpu,
        ram: gsmarenaPhone.specifications?.performance?.ram || [],
        storage: gsmarenaPhone.specifications?.performance?.storage || [],
        expandableStorage: gsmarenaPhone.specifications?.performance?.card_slot,
      },
      battery: {
        capacity: gsmarenaPhone.specifications?.battery?.capacity || 0,
        chargingSpeed: gsmarenaPhone.specifications?.battery?.charging,
        wirelessCharging: gsmarenaPhone.specifications?.battery?.wireless,
      },
      connectivity: {
        network: gsmarenaPhone.specifications?.connectivity?.network || [],
        wifi: gsmarenaPhone.specifications?.connectivity?.wifi || '',
        bluetooth: gsmarenaPhone.specifications?.connectivity?.bluetooth || '',
        nfc: gsmarenaPhone.specifications?.connectivity?.nfc,
      },
      build: {
        dimensions: gsmarenaPhone.specifications?.build?.dimensions || '',
        weight: gsmarenaPhone.specifications?.build?.weight || '',
        materials: gsmarenaPhone.specifications?.build?.materials || [],
        colors: gsmarenaPhone.specifications?.build?.colors || [],
        waterResistance: gsmarenaPhone.specifications?.build?.ip_rating,
      },
      software: {
        os: gsmarenaPhone.specifications?.software?.os || '',
        version: gsmarenaPhone.specifications?.software?.version || '',
      },
    };

    return {
      brand: gsmarenaPhone.brand,
      model: gsmarenaPhone.model,
      launchDate: gsmarenaPhone.launch_date ? new Date(gsmarenaPhone.launch_date) : new Date(),
      availability: gsmarenaPhone.status || 'available',
      pricing: {
        mrp: gsmarenaPhone.price?.price || 0,
        currentPrice: gsmarenaPhone.price?.price || 0,
        currency: 'INR' as const,
      },
      specifications,
      images: gsmarenaPhone.images || [],
    };
  }

  /**
   * Make HTTP request to GSMArena API with retry logic
   */
  private async makeRequest(endpoint: string): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Rate limiting
        if (attempt > 1) {
          await this.delay(this.rateLimitDelay * attempt);
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'MobileMatrix/1.0',
          },
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`GSMArena API request attempt ${attempt} failed:`, lastError.message);
        
        if (attempt === this.config.retryAttempts) {
          break;
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Validate and parse phone data from GSMArena
   */
  private validateAndParsePhone(phoneData: any): GSMArenaPhone {
    try {
      return GSMArenaPhoneSchema.parse(phoneData);
    } catch (error) {
      console.error('Invalid phone data from GSMArena:', error);
      throw new Error('Invalid phone data format from GSMArena');
    }
  }

  /**
   * Parse camera specifications from strings
   */
  private parseCameraSpecs(cameraStrings: string[]): any[] {
    return cameraStrings.map(spec => this.parseCameraSpec(spec));
  }

  /**
   * Parse single camera specification
   */
  private parseCameraSpec(cameraString: string): any {
    if (!cameraString) {
      return { megapixels: 0, features: [] };
    }

    // Extract megapixels from strings like "48MP", "48 MP", "48-megapixel"
    const mpMatch = cameraString.match(/(\d+)\s*(?:MP|megapixel)/i);
    const megapixels = mpMatch ? parseInt(mpMatch[1], 10) : 0;

    // Extract aperture from strings like "f/1.8", "f/2.2"
    const apertureMatch = cameraString.match(/f\/(\d+\.?\d*)/i);
    const aperture = apertureMatch ? `f/${apertureMatch[1]}` : undefined;

    return {
      megapixels,
      aperture,
      features: [],
      videoRecording: undefined,
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}