// Environment variable configuration and validation

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',

  // Redis
  REDIS_URL: process.env.REDIS_URL || '',

  // AI Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',

  // External APIs
  GSMARENA_API_KEY: process.env.GSMARENA_API_KEY || '',
  PRICE_TRACKING_API_KEY: process.env.PRICE_TRACKING_API_KEY || '',

  // Auth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Validation function to check required environment variables
export function validateEnv() {
  const requiredVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'NEXTAUTH_SECRET',
  ] as const;

  const missing = requiredVars.filter(key => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
