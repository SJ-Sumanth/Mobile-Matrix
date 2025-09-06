// Database types based on Prisma schema
export type PhoneAvailability = 'AVAILABLE' | 'DISCONTINUED' | 'UPCOMING'
export type ChatStep = 'BRAND_SELECTION' | 'MODEL_SELECTION' | 'COMPARISON' | 'COMPLETED'
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export interface Brand {
  id: string
  name: string
  slug: string
  logoUrl?: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Phone {
  id: string
  brandId: string
  model: string
  variant?: string
  slug: string
  launchDate?: Date
  availability: PhoneAvailability
  mrp?: number
  currentPrice?: number
  currency: string
  images: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PhoneSpecification {
  id: string
  phoneId: string
  
  // Display specifications
  displaySize?: string
  displayResolution?: string
  displayType?: string
  refreshRate?: number
  brightness?: number
  
  // Camera specifications
  rearCameraMain?: string
  rearCameraUltra?: string
  rearCameraTele?: string
  rearCameraDepth?: string
  frontCamera?: string
  cameraFeatures: string[]
  
  // Performance specifications
  processor?: string
  gpu?: string
  ramOptions: string[]
  storageOptions: string[]
  expandableStorage: boolean
  
  // Battery specifications
  batteryCapacity?: number
  chargingSpeed?: number
  wirelessCharging: boolean
  
  // Connectivity specifications
  networkSupport: string[]
  wifi?: string
  bluetooth?: string
  nfc: boolean
  
  // Build specifications
  dimensions?: string
  weight?: string
  materials: string[]
  colors: string[]
  waterResistance?: string
  
  // Software specifications
  operatingSystem?: string
  osVersion?: string
  updateSupport?: string
  
  createdAt: Date
  updatedAt: Date
}

export interface ChatSession {
  id: string
  sessionId: string
  userId?: string
  currentStep: ChatStep
  selectedBrand?: string
  selectedPhones: string[]
  preferences?: Record<string, any>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  chatSessionId: string
  role: MessageRole
  content: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface PhoneComparison {
  id: string
  chatSessionId?: string
  phone1Id: string
  phone2Id: string
  result?: Record<string, any>
  insights: string[]
  overallWinner?: string
  shareToken?: string
  createdAt: Date
  updatedAt: Date
}

// Extended types with relations
export interface PhoneWithBrand extends Phone {
  brand: Brand
}

export interface PhoneWithSpecifications extends Phone {
  brand: Brand
  specifications?: PhoneSpecification
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

export interface PhoneComparisonWithPhones extends PhoneComparison {
  phone1: PhoneWithSpecifications
  phone2: PhoneWithSpecifications
}

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}