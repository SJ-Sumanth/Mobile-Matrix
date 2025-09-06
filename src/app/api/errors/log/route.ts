import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/errorHandler';
import { ErrorLogEntry } from '@/types/errors';
import { z } from 'zod';

// Validation schema for error logging request
const ErrorLogRequestSchema = z.object({
  errors: z.array(z.object({
    id: z.string(),
    error: z.object({
      name: z.string(),
      message: z.string(),
      code: z.string().optional(),
      stack: z.string().optional(),
      statusCode: z.number().optional(),
    }),
    context: z.object({
      userId: z.string().optional(),
      sessionId: z.string().optional(),
      requestId: z.string().optional(),
      userAgent: z.string().optional(),
      ip: z.string().optional(),
      path: z.string().optional(),
      method: z.string().optional(),
      timestamp: z.string().transform(str => new Date(str)),
    }),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    resolved: z.boolean().default(false),
    createdAt: z.string().transform(str => new Date(str)),
  })),
});

async function handleErrorLogging(request: NextRequest) {
  try {
    const body = await request.json();
    const { errors } = ErrorLogRequestSchema.parse(body);

    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Process each error
    const processedErrors = errors.map(error => ({
      ...error,
      context: {
        ...error.context,
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    }));

    // In a real application, you would:
    // 1. Store errors in a database
    // 2. Send to external monitoring services (Sentry, DataDog, etc.)
    // 3. Trigger alerts for critical errors
    // 4. Aggregate error metrics

    // For now, we'll log to console and store basic info
    console.log(`Received ${processedErrors.length} error(s) from client:`, {
      ip: clientIP,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    // Log each error with appropriate level
    processedErrors.forEach(error => {
      const logLevel = error.severity === 'critical' ? 'error' : 
                      error.severity === 'high' ? 'error' :
                      error.severity === 'medium' ? 'warn' : 'info';
      
      console[logLevel]('Client Error:', {
        id: error.id,
        name: error.error.name,
        message: error.error.message,
        code: error.error.code,
        severity: error.severity,
        context: error.context,
      });
    });

    // Check for critical errors that need immediate attention
    const criticalErrors = processedErrors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      // In production, you might want to:
      // - Send alerts to Slack/email
      // - Create incident tickets
      // - Trigger monitoring alerts
      console.error(`CRITICAL: ${criticalErrors.length} critical error(s) received!`);
    }

    // Simulate storing in database (replace with actual database operations)
    await simulateErrorStorage(processedErrors);

    return NextResponse.json({
      success: true,
      message: `Successfully logged ${processedErrors.length} error(s)`,
      processed: processedErrors.length,
      critical: criticalErrors.length,
    });

  } catch (error) {
    console.error('Error logging endpoint failed:', error);
    
    // Even if our error logging fails, we should return success
    // to prevent infinite error loops
    return NextResponse.json({
      success: false,
      message: 'Failed to process error logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Simulate error storage (replace with actual database operations)
 */
async function simulateErrorStorage(errors: ErrorLogEntry[]): Promise<void> {
  // In a real application, you would store these in a database
  // For example, using Prisma:
  /*
  await prisma.errorLog.createMany({
    data: errors.map(error => ({
      id: error.id,
      errorName: error.error.name,
      errorMessage: error.error.message,
      errorCode: error.error.code,
      errorStack: error.error.stack,
      statusCode: error.error.statusCode,
      userId: error.context.userId,
      sessionId: error.context.sessionId,
      userAgent: error.context.userAgent,
      ip: error.context.ip,
      path: error.context.path,
      severity: error.severity,
      resolved: error.resolved,
      createdAt: error.createdAt,
    })),
  });
  */

  // For now, just simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Export the handler with error handling middleware
export const POST = withErrorHandler(handleErrorLogging);

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'error-logging',
    timestamp: new Date().toISOString(),
  });
}