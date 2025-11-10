import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';


// Config
import logger from './config/logger';
import { initializeDatabase } from './models/database.schema';
import { seedDatabase } from './seed-data';
import { setupSwagger } from './config/swagger';

// Routes
import projectRoutes from './routes/project.routes';
import executionRoutes from './routes/execution.routes';
import testRoutes from './routes/test.routes';
import userRoutes from './routes/user.routes';
import playwrightRoutes from './routes/playwright.routes';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  public server: http.Server;
  public io: Server;
  private port: number;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });
    this.port = parseInt(process.env.PORT || '5000');

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }));

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Static files (for screenshots and videos)
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    this.app.use('/reports', express.static(path.join(__dirname, '../public/reports')));

    // Swagger documentation
    setupSwagger(this.app);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    const apiVersion = process.env.API_VERSION || 'v1';

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Test Runner API is running',
        version: apiVersion,
        timestamp: new Date().toISOString()
      });
    });

    // API Routes
    this.app.use(`/api/${apiVersion}/projects`, projectRoutes);
    this.app.use(`/api/${apiVersion}/executions`, executionRoutes);
    this.app.use(`/api/${apiVersion}/tests`, testRoutes);
    this.app.use(`/api/${apiVersion}/users`, userRoutes);
    this.app.use(`/api/${apiVersion}/playwright`, playwrightRoutes);


    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to Test Runner Platform API',
        version: apiVersion,
        documentation: {
          swagger: '/api-docs',
          swagger_json: '/api-docs.json'
        },
        endpoints: {
          projects: `/api/${apiVersion}/projects`,
          tests: `/api/${apiVersion}/tests`,
          executions: `/api/${apiVersion}/executions`,
          users: `/api/${apiVersion}/users`,
          health: '/health'
        }
      });
    });
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Join test execution room
      socket.on('join-execution', (executionId: string) => {
        socket.join(`execution-${executionId}`);
        logger.info(`Client ${socket.id} joined execution room: ${executionId}`);
      });
    });

    // Make io available globally for test execution updates
    (global as any).io = this.io;
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();

      // Seed database with sample data (only if empty)
      await seedDatabase();

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Test Runner Platform API                             ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                    ║
║   Port: ${this.port}                                              ║
║   API Version: ${process.env.API_VERSION || 'v1'}                                      ║
║                                                            ║
║   📍 Server: http://localhost:${this.port}                        ║
║   📍 Health: http://localhost:${this.port}/health                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
        `);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getServer(): http.Server {
    return this.server;
  }
}

export default App;