import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('🌱 Starting database seed...')

  // Create brands first
  console.log('Creating brands...')
  const appleId = await prisma.brand.upsert({
    where: { slug: 'apple' },
    update: {},
    create: {
      name: 'Apple',
      slug: 'apple',
      logoUrl: '/brands/apple.png',
      description: 'Premium smartphones with iOS',
      isActive: true,
    },
  })

  const samsungId = await prisma.brand.upsert({
    where: { slug: 'samsung' },
    update: {},
    create: {
      name: 'Samsung',
      slug: 'samsung',
      logoUrl: '/brands/samsung.png',
      description: 'Android smartphones with innovative features',
      isActive: true,
    },
  })

  console.log('✅ Created 2 brands')

  // Create a simple phone with specifications
  console.log('Creating phones...')
  const iphone = await prisma.phone.upsert({
    where: { slug: 'apple-iphone-15-pro-128gb' },
    update: {},
    create: {
      brandId: appleId.id,
      model: 'iPhone 15 Pro',
      variant: '128GB',
      slug: 'apple-iphone-15-pro-128gb',
      launchDate: new Date('2023-09-22'),
      availability: 'AVAILABLE',
      mrp: 134900,
      currentPrice: 129900,
      images: ['/phones/iphone-15-pro-1.jpg'],
      specifications: {
        create: {
          displaySize: '6.1 inches',
          displayResolution: '2556 x 1179',
          displayType: 'Super Retina XDR OLED',
          refreshRate: 120,
          brightness: 2000,
          rearCameraMain: '48MP',
          frontCamera: '12MP',
          cameraFeatures: ['Night mode', 'Portrait mode'],
          processor: 'A17 Pro',
          ramOptions: ['8GB'],
          storageOptions: ['128GB', '256GB'],
          expandableStorage: false,
          batteryCapacity: 3274,
          chargingSpeed: 27,
          wirelessCharging: true,
          networkSupport: ['5G', '4G LTE'],
          wifi: 'Wi-Fi 6E',
          bluetooth: '5.3',
          nfc: true,
          dimensions: '146.6 x 70.6 x 8.25 mm',
          weight: '187g',
          materials: ['Titanium', 'Glass'],
          colors: ['Natural Titanium', 'Blue Titanium'],
          waterResistance: 'IP68',
          operatingSystem: 'iOS',
          osVersion: '17',
          updateSupport: '5+ years',
        },
      },
    },
  })

  const galaxy = await prisma.phone.upsert({
    where: { slug: 'samsung-galaxy-s24-ultra-256gb' },
    update: {},
    create: {
      brandId: samsungId.id,
      model: 'Galaxy S24 Ultra',
      variant: '256GB',
      slug: 'samsung-galaxy-s24-ultra-256gb',
      launchDate: new Date('2024-01-24'),
      availability: 'AVAILABLE',
      mrp: 129999,
      currentPrice: 119999,
      images: ['/phones/galaxy-s24-ultra-1.jpg'],
      specifications: {
        create: {
          displaySize: '6.8 inches',
          displayResolution: '3120 x 1440',
          displayType: 'Dynamic AMOLED 2X',
          refreshRate: 120,
          brightness: 2600,
          rearCameraMain: '200MP',
          frontCamera: '12MP',
          cameraFeatures: ['Night mode', '8K video'],
          processor: 'Snapdragon 8 Gen 3',
          ramOptions: ['12GB'],
          storageOptions: ['256GB', '512GB'],
          expandableStorage: false,
          batteryCapacity: 5000,
          chargingSpeed: 45,
          wirelessCharging: true,
          networkSupport: ['5G', '4G LTE'],
          wifi: 'Wi-Fi 7',
          bluetooth: '5.3',
          nfc: true,
          dimensions: '162.3 x 79.0 x 8.6 mm',
          weight: '232g',
          materials: ['Aluminum', 'Glass'],
          colors: ['Titanium Black', 'Titanium Gray'],
          waterResistance: 'IP68',
          operatingSystem: 'Android',
          osVersion: '14',
          updateSupport: '7 years',
        },
      },
    },
  })

  console.log('✅ Created 2 phones with specifications')
  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })