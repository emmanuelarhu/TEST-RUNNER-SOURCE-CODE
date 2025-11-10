import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express, Application } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Test Runner Platform API',
      version: '1.0.0',
      description: 'A comprehensive test automation platform with Playwright integration',
      contact: {
        name: 'Emmanuel Arhu',
        email: 'emmanuel@example.com',
        url: 'https://emmanuelarhu.link'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.testrunner.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'E-Commerce Test Suite' },
            description: { type: 'string', example: 'Tests for e-commerce platform' },
            base_url: { type: 'string', format: 'uri', example: 'https://example.com' },
            created_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        TestSuite: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            project_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Login Flow Tests' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['active', 'archived', 'draft'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        TestCase: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            suite_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Valid User Login' },
            description: { type: 'string' },
            test_type: { 
              type: 'string', 
              enum: ['functional', 'api', 'e2e', 'integration', 'smoke', 'regression'] 
            },
            priority: { 
              type: 'string', 
              enum: ['critical', 'high', 'medium', 'low'] 
            },
            test_script: { type: 'string' },
            expected_result: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        TestExecution: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            test_case_id: { type: 'string', format: 'uuid' },
            status: { 
              type: 'string', 
              enum: ['pending', 'running', 'passed', 'failed', 'skipped', 'error'] 
            },
            duration_ms: { type: 'integer' },
            error_message: { type: 'string' },
            screenshot_path: { type: 'string' },
            browser: { type: 'string', enum: ['chromium', 'firefox', 'webkit'] },
            environment: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /users/login or /users/register endpoint'
        }
      }
    },
    tags: [
      {
        name: 'Users',
        description: 'User authentication and management endpoints'
      },
      {
        name: 'Projects',
        description: 'Project management endpoints'
      },
      {
        name: 'Test Suites',
        description: 'Test suite management'
      },
      {
        name: 'Test Cases',
        description: 'Test case management'
      },
      {
        name: 'Execution',
        description: 'Test execution endpoints'
      },
      {
        name: 'Health',
        description: 'System health checks'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Test Runner API Docs'
  }));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;