import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS configuration
 */
interface CORSConfig {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

/**
 * Default CORS configuration
 */
const defaultCORSConfig: CORSConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://mobilematrix.com',
        'https://www.mobilematrix.com',
        'https://mobilematrix.vercel.app',
      ]
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Client-Version',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

/**
 * CORS middleware
 */
export function withCORS(
  config: CORSConfig = defaultCORSConfig
) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const origin = request.headers.get('origin');
      
      // Handle preflight OPTIONS requests
      if (request.method === 'OPTIONS') {
        return handlePreflightRequest(request, config);
      }
      
      // Execute the main handler
      const response = await handler(request);
      
      // Add CORS headers to the response
      addCORSHeaders(response, origin, config);
      
      return response;
    };
  };
}

/**
 * Handle preflight OPTIONS requests
 */
function handlePreflightRequest(request: NextRequest, config: CORSConfig): NextResponse {
  const response = new NextResponse(null, { status: config.optionsSuccessStatus || 200 });
  const origin = request.headers.get('origin');
  
  addCORSHeaders(response, origin, config);
  
  return response;
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response: NextResponse, origin: string | null, config: CORSConfig) {
  // Handle origin
  if (config.origin === true) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  } else if (typeof config.origin === 'string') {
    response.headers.set('Access-Control-Allow-Origin', config.origin);
  } else if (Array.isArray(config.origin) && origin) {
    if (config.origin.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
  }
  
  // Handle credentials
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle methods
  if (config.methods) {
    response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
  }
  
  // Handle allowed headers
  if (config.allowedHeaders) {
    response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
  }
  
  // Handle exposed headers
  if (config.exposedHeaders) {
    response.headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  }
  
  // Handle max age
  if (config.maxAge) {
    response.headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders() {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const response = await handler(request);
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      // Content Security Policy (adjust based on your needs)
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.openai.com https://api.anthropic.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
      
      response.headers.set('Content-Security-Policy', csp);
      
      // HSTS (only in production with HTTPS)
      if (process.env.NODE_ENV === 'production') {
        response.headers.set(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload'
        );
      }
      
      return response;
    };
  };
}

/**
 * Request ID middleware for tracing
 */
export function withRequestId() {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      // Generate unique request ID
      const requestId = generateRequestId();
      
      // Add request ID to request headers (for logging)
      const requestWithId = new NextRequest(request, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'x-request-id': requestId,
        },
      });
      
      const response = await handler(requestWithId);
      
      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);
      
      return response;
    };
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}