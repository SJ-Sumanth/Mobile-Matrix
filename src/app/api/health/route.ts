import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Redis from 'redis';

// Health check endpoint for production monitoring
export async function GET() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      ai_service: 'unknown'
    },
    metrics: {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: process.cpuUsage(),
      responseTime: 0
    }
  };

  let overallHealthy = true;

  // Check database connection
  try {
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    health.services.database = 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    health.services.database = 'unhealthy';
    overallHealthy = false;
  }

  // Check Redis connection
  try {
    const redis = Redis.createClient({
      url: process.env.REDIS_URL
    });
    await redis.connect();
    await redis.ping();
    await redis.disconnect();
    health.services.redis = 'healthy';
  } catch (error) {
    console.error('Redis health check failed:', error);
    health.services.redis = 'unhealthy';
    overallHealthy = false;
  }

  // Check AI service (basic check)
  try {
    if (process.env.GEMINI_API_KEY) {
      health.services.ai_service = 'healthy';
    } else {
      health.services.ai_service = 'misconfigured';
      overallHealthy = false;
    }
  } catch (error) {
    console.error('AI service health check failed:', error);
    health.services.ai_service = 'unhealthy';
    overallHealthy = false;
  }

  // Calculate response time
  health.metrics.responseTime = Date.now() - startTime;

  // Set overall status
  health.status = overallHealthy ? 'healthy' : 'unhealthy';

  // Return appropriate HTTP status code
  const statusCode = overallHealthy ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

// Also support HEAD requests for simple uptime checks
export async function HEAD() {
  try {
    // Quick health check without detailed service checks
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}