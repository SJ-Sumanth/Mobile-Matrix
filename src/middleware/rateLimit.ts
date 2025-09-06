import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '../lib/cache.js';
import { createAPIError } from '../utils/api.js';

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Default rate limit configurations for different endpoints
export const RateLimitConfigs = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  },
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  chat: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
  },
  comparison: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 requests per 5 minutes
  },
} as const;

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  config: RateLimitConfig = RateLimitConfigs.default
) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        // Generate rate limit key
        const key = config.keyGenerator 
          ? config.keyGenerator(request)
          : generateDefaultKey(request);
        
        const cacheKey = `rate_limit:${key}`;
        
        // Get current request count
        const currentCount = await cacheService.get<number>(cacheKey) || 0;
        
        // Check if rate limit exceeded
        if (currentCount >= config.maxRequests) {
          const resetTime = new Date(Date.now() + config.windowMs);
          
          return NextResponse.json(
            createAPIError(
              'RATE_LIMIT_EXCEEDED',
              `Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`,
              429,
              {
                limit: config.maxRequests,
                remaining: 0,
                reset: resetTime,
                retryAfter: Math.ceil(config.windowMs / 1000),
              }
            ),
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': resetTime.getTime().toString(),
                'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
              }
            }
          );
        }
        
        // Increment request count
        await cacheService.set(
          cacheKey, 
          currentCount + 1, 
          Math.ceil(config.windowMs / 1000)
        );
        
        // Execute the handler
        const response = await handler(request);
        
        // Add rate limit headers to successful responses
        const remaining = Math.max(0, config.maxRequests - currentCount - 1);
        const resetTime = new Date(Date.now() + config.windowMs);
        
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', resetTime.getTime().toString());
        
        return response;
      } catch (error) {
        console.error('Rate limiting error:', error);
        // If rate limiting fails, allow the request to proceed
        return handler(request);
      }
    };
  };
}

/**
 * Generate default rate limit key based on IP address and user agent
 */
function generateDefaultKey(request: NextRequest): string {
  // Try to get real IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown';
  
  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userAgentHash = hashString(userAgent);
  
  return `${ip}:${userAgentHash}`;
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Rate limit middleware for specific endpoints
 */
export const withSearchRateLimit = withRateLimit(RateLimitConfigs.search);
export const withChatRateLimit = withRateLimit(RateLimitConfigs.chat);
export const withComparisonRateLimit = withRateLimit(RateLimitConfigs.comparison);