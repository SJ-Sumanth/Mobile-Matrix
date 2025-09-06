import { NextRequest, NextResponse } from 'next/server';

/**
 * OpenAPI/Swagger specification for MobileMatrix API
 */
const openAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'MobileMatrix API',
    description: 'AI-powered phone comparison platform API',
    version: '1.0.0',
    contact: {
      name: 'MobileMatrix Support',
      email: 'support@mobilematrix.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://mobilematrix.com/api'
        : 'http://localhost:3000/api',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check the health status of the API and its dependencies',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System is healthy or degraded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthCheckResponse',
                },
              },
            },
          },
          '503': {
            description: 'System is unhealthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/phones/search': {
      get: {
        summary: 'Search phones',
        description: 'Search for phones by query string',
        tags: ['Phones'],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            description: 'Search query (minimum 2 characters)',
            schema: {
              type: 'string',
              minLength: 2,
            },
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            description: 'Page number for pagination',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Number of items per page',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Phones found successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaginatedPhonesResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid search query',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/phones/{id}': {
      get: {
        summary: 'Get phone by ID',
        description: 'Retrieve detailed information about a specific phone',
        tags: ['Phones'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Phone ID',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Phone found successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PhoneResponse',
                },
              },
            },
          },
          '404': {
            description: 'Phone not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/phones/brands': {
      get: {
        summary: 'Get all brands',
        description: 'Retrieve all available phone brands',
        tags: ['Phones'],
        responses: {
          '200': {
            description: 'Brands retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BrandsResponse',
                },
              },
            },
          },
        },
      },
    },
    '/phones/brands/{brandId}/models': {
      get: {
        summary: 'Get models by brand',
        description: 'Retrieve all phone models for a specific brand',
        tags: ['Phones'],
        parameters: [
          {
            name: 'brandId',
            in: 'path',
            required: true,
            description: 'Brand ID',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Models retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ModelsResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid brand ID',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/comparison': {
      post: {
        summary: 'Compare phones',
        description: 'Generate a detailed comparison between two phones',
        tags: ['Comparison'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ComparisonRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Comparison generated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ComparisonResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid request data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'One or both phones not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/chat': {
      post: {
        summary: 'Process chat message',
        description: 'Process a chat message with AI and return response',
        tags: ['Chat'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChatMessageRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Message processed successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ChatMessageResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid message or context',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/chat/extract-phone': {
      post: {
        summary: 'Extract phone selection',
        description: 'Extract phone brand and model from user message',
        tags: ['Chat'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PhoneExtractionRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Phone selection extracted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PhoneSelectionResponse',
                },
              },
            },
          },
          '400': {
            description: 'No phone detected in message',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      // Success Response Schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          requestId: {
            type: 'string',
            example: 'req_1234567890_abc123',
          },
        },
        required: ['success', 'data', 'timestamp'],
      },
      
      // Error Response Schema
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Request validation failed',
              },
              details: {
                type: 'object',
              },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                example: 'medium',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              requestId: {
                type: 'string',
                example: 'req_1234567890_abc123',
              },
            },
            required: ['code', 'message', 'severity', 'timestamp'],
          },
        },
        required: ['success', 'error'],
      },
      
      // Phone Schema
      Phone: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'phone_123',
          },
          brand: {
            type: 'string',
            example: 'Apple',
          },
          model: {
            type: 'string',
            example: 'iPhone 15 Pro',
          },
          variant: {
            type: 'string',
            example: '256GB',
          },
          launchDate: {
            type: 'string',
            format: 'date-time',
          },
          availability: {
            type: 'string',
            enum: ['available', 'discontinued', 'upcoming'],
            example: 'available',
          },
          pricing: {
            type: 'object',
            properties: {
              mrp: {
                type: 'number',
                example: 134900,
              },
              currentPrice: {
                type: 'number',
                example: 129900,
              },
              currency: {
                type: 'string',
                example: 'INR',
              },
            },
            required: ['mrp', 'currentPrice', 'currency'],
          },
          specifications: {
            type: 'object',
            // Detailed specifications would be defined here
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['https://example.com/phone1.jpg'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['id', 'brand', 'model', 'launchDate', 'availability', 'pricing', 'specifications'],
      },
      
      // Brand Schema
      Brand: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'brand_123',
          },
          name: {
            type: 'string',
            example: 'Apple',
          },
          logo: {
            type: 'string',
            example: 'https://example.com/apple-logo.png',
          },
        },
        required: ['id', 'name'],
      },
      
      // Phone Model Schema
      PhoneModel: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'model_123',
          },
          brandId: {
            type: 'string',
            example: 'brand_123',
          },
          name: {
            type: 'string',
            example: 'iPhone 15 Pro',
          },
          series: {
            type: 'string',
            example: 'Pro',
          },
          launchYear: {
            type: 'integer',
            example: 2023,
          },
        },
        required: ['id', 'brandId', 'name', 'launchYear'],
      },
      
      // Request Schemas
      ComparisonRequest: {
        type: 'object',
        properties: {
          phone1Id: {
            type: 'string',
            example: 'phone_123',
          },
          phone2Id: {
            type: 'string',
            example: 'phone_456',
          },
          categories: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['camera', 'performance', 'battery'],
          },
        },
        required: ['phone1Id', 'phone2Id'],
      },
      
      ChatMessageRequest: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'I want to compare iPhone 15 Pro with Samsung Galaxy S24',
          },
          context: {
            type: 'object',
            // Chat context schema would be defined here
          },
        },
        required: ['message', 'context'],
      },
      
      PhoneExtractionRequest: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'I want to compare iPhone 15 Pro with Samsung Galaxy S24',
          },
        },
        required: ['message'],
      },
      
      // Response Schemas
      PhoneResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                $ref: '#/components/schemas/Phone',
              },
            },
          },
        ],
      },
      
      PaginatedPhonesResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Phone',
                    },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      page: {
                        type: 'integer',
                        example: 1,
                      },
                      limit: {
                        type: 'integer',
                        example: 20,
                      },
                      total: {
                        type: 'integer',
                        example: 100,
                      },
                      totalPages: {
                        type: 'integer',
                        example: 5,
                      },
                      hasNext: {
                        type: 'boolean',
                        example: true,
                      },
                      hasPrev: {
                        type: 'boolean',
                        example: false,
                      },
                    },
                    required: ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev'],
                  },
                },
                required: ['items', 'meta'],
              },
            },
          },
        ],
      },
      
      BrandsResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Brand',
                },
              },
            },
          },
        ],
      },
      
      ModelsResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/PhoneModel',
                },
              },
            },
          },
        ],
      },
      
      ComparisonResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  phones: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Phone',
                    },
                    minItems: 2,
                    maxItems: 2,
                  },
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                    },
                  },
                  insights: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    example: ['Phone 1 has better camera quality', 'Phone 2 has longer battery life'],
                  },
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    example: ['Choose Phone 1 for photography', 'Choose Phone 2 for all-day usage'],
                  },
                  generatedAt: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
                required: ['phones', 'categories', 'insights', 'recommendations', 'generatedAt'],
              },
            },
          },
        ],
      },
      
      ChatMessageResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'I can help you compare those phones. Let me get their details.',
                  },
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    example: ['Compare camera quality', 'Compare battery life', 'Compare performance'],
                  },
                  nextStep: {
                    type: 'string',
                    enum: ['brand_selection', 'model_selection', 'comparison', 'completed'],
                    example: 'comparison',
                  },
                  extractedData: {
                    type: 'object',
                  },
                  confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    example: 0.95,
                  },
                },
                required: ['message'],
              },
            },
          },
        ],
      },
      
      PhoneSelectionResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  brand: {
                    type: 'string',
                    example: 'Apple',
                  },
                  model: {
                    type: 'string',
                    example: 'iPhone 15 Pro',
                  },
                  variant: {
                    type: 'string',
                    example: '256GB',
                  },
                },
                required: ['brand', 'model'],
              },
            },
          },
        ],
      },
      
      HealthCheckResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'degraded', 'unhealthy'],
                    example: 'healthy',
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                  services: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['healthy', 'degraded', 'unhealthy'],
                        },
                        responseTime: {
                          type: 'number',
                        },
                        error: {
                          type: 'string',
                        },
                      },
                      required: ['status'],
                    },
                  },
                  uptime: {
                    type: 'number',
                    example: 3600.5,
                  },
                  version: {
                    type: 'string',
                    example: '1.0.0',
                  },
                },
                required: ['status', 'timestamp', 'services', 'uptime', 'version'],
              },
            },
          },
        ],
      },
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
  tags: [
    {
      name: 'System',
      description: 'System health and monitoring endpoints',
    },
    {
      name: 'Phones',
      description: 'Phone data and search endpoints',
    },
    {
      name: 'Comparison',
      description: 'Phone comparison endpoints',
    },
    {
      name: 'Chat',
      description: 'AI chat and interaction endpoints',
    },
  ],
};

/**
 * GET /api/docs - Return OpenAPI specification
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(openAPISpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}