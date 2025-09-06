import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '../../generated/prisma/index.js'

// Test database instance
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
})

beforeAll(async () => {
  // Connect to test database
  await testDb.$connect()
})

afterAll(async () => {
  // Disconnect from test database
  await testDb.$disconnect()
})

beforeEach(async () => {
  // Clean up database before each test
  await cleanupDatabase()
})

async function cleanupDatabase() {
  // Delete in correct order to respect foreign key constraints
  await testDb.chatMessage.deleteMany()
  await testDb.phoneComparison.deleteMany()
  await testDb.chatSession.deleteMany()
  await testDb.phoneSpecification.deleteMany()
  await testDb.phone.deleteMany()
  await testDb.brand.deleteMany()
}

// Test data factories
export const createTestBrand = (overrides: Partial<any> = {}) => ({
  name: 'Test Brand',
  slug: 'test-brand',
  logoUrl: '/test-logo.png',
  description: 'Test brand description',
  isActive: true,
  ...overrides,
})

export const createTestPhone = (brandId: string, overrides: Partial<any> = {}) => ({
  brandId,
  model: 'Test Phone',
  variant: '128GB',
  slug: 'test-brand-test-phone-128gb',
  launchDate: new Date('2024-01-01'),
  availability: 'AVAILABLE' as const,
  mrp: 50000,
  currentPrice: 45000,
  currency: 'INR',
  images: ['/test-phone.jpg'],
  isActive: true,
  ...overrides,
})

export const createTestPhoneSpecification = (phoneId: string, overrides: Partial<any> = {}) => ({
  phoneId,
  displaySize: '6.1 inches',
  displayResolution: '2556 x 1179',
  displayType: 'OLED',
  refreshRate: 120,
  brightness: 1000,
  rearCameraMain: '48MP',
  frontCamera: '12MP',
  cameraFeatures: ['Night mode'],
  processor: 'Test Processor',
  ramOptions: ['8GB'],
  storageOptions: ['128GB'],
  expandableStorage: false,
  batteryCapacity: 3000,
  chargingSpeed: 25,
  wirelessCharging: true,
  networkSupport: ['5G', '4G'],
  wifi: 'Wi-Fi 6',
  bluetooth: '5.0',
  nfc: true,
  dimensions: '146 x 71 x 8 mm',
  weight: '180g',
  materials: ['Glass', 'Aluminum'],
  colors: ['Black', 'White'],
  waterResistance: 'IP68',
  operatingSystem: 'Android',
  osVersion: '14',
  updateSupport: '3 years',
  ...overrides,
})

export const createTestChatSession = (overrides: Partial<any> = {}) => ({
  sessionId: 'test-session-' + Math.random().toString(36).substring(7),
  userId: 'test-user',
  currentStep: 'BRAND_SELECTION' as const,
  selectedBrand: null,
  selectedPhones: [],
  preferences: {},
  isActive: true,
  ...overrides,
})