import { z } from 'zod';

// Camera specification schema and type
export const CameraSpecSchema = z.object({
  megapixels: z.number(),
  aperture: z.string().optional(),
  features: z.array(z.string()).default([]),
  videoRecording: z.string().optional(),
});

export type CameraSpec = z.infer<typeof CameraSpecSchema>;

// Phone specifications schema and type
export const PhoneSpecificationsSchema = z.object({
  display: z.object({
    size: z.string(),
    resolution: z.string(),
    type: z.string(),
    refreshRate: z.number().optional(),
    brightness: z.number().optional(),
  }),
  camera: z.object({
    rear: z.array(CameraSpecSchema),
    front: CameraSpecSchema,
    features: z.array(z.string()).default([]),
  }),
  performance: z.object({
    processor: z.string(),
    gpu: z.string().optional(),
    ram: z.array(z.string()),
    storage: z.array(z.string()),
    expandableStorage: z.boolean().optional(),
  }),
  battery: z.object({
    capacity: z.number(),
    chargingSpeed: z.number().optional(),
    wirelessCharging: z.boolean().optional(),
  }),
  connectivity: z.object({
    network: z.array(z.string()),
    wifi: z.string(),
    bluetooth: z.string(),
    nfc: z.boolean().optional(),
  }),
  build: z.object({
    dimensions: z.string(),
    weight: z.string(),
    materials: z.array(z.string()),
    colors: z.array(z.string()),
    waterResistance: z.string().optional(),
  }),
  software: z.object({
    os: z.string(),
    version: z.string(),
    updateSupport: z.string().optional(),
  }),
});

export type PhoneSpecifications = z.infer<typeof PhoneSpecificationsSchema>;

// Phone pricing schema and type
export const PhonePricingSchema = z.object({
  mrp: z.number(),
  currentPrice: z.number(),
  currency: z.literal('INR'),
});

export type PhonePricing = z.infer<typeof PhonePricingSchema>;

// Phone availability enum
export const PhoneAvailabilitySchema = z.enum(['available', 'discontinued', 'upcoming']);
export type PhoneAvailability = z.infer<typeof PhoneAvailabilitySchema>;

// Main Phone schema and type
export const PhoneSchema = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  variant: z.string().optional(),
  launchDate: z.date(),
  availability: PhoneAvailabilitySchema,
  pricing: PhonePricingSchema,
  specifications: PhoneSpecificationsSchema,
  images: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Phone = z.infer<typeof PhoneSchema>;

// Brand schema and type
export const BrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  country: z.string().optional(),
  established: z.number().optional(),
});

export type Brand = z.infer<typeof BrandSchema>;

// Phone model schema and type
export const PhoneModelSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  name: z.string(),
  series: z.string().optional(),
  launchYear: z.number(),
});

export type PhoneModel = z.infer<typeof PhoneModelSchema>;

// Phone selection schema and type
export const PhoneSelectionSchema = z.object({
  brand: z.string(),
  model: z.string(),
  variant: z.string().optional(),
});

export type PhoneSelection = z.infer<typeof PhoneSelectionSchema>;

// Phone scores schema and type (for comparison scoring)
export const PhoneScoresSchema = z.object({
  overall: z.number().min(0).max(100),
  display: z.number().min(0).max(100),
  camera: z.number().min(0).max(100),
  performance: z.number().min(0).max(100),
  battery: z.number().min(0).max(100),
  build: z.number().min(0).max(100),
  value: z.number().min(0).max(100),
});

export type PhoneScores = z.infer<typeof PhoneScoresSchema>;
