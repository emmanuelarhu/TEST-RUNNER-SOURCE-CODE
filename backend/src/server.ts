import App from './app';
import logger from './config/logger';

const app = new App();

// Start the server
app.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  const server = app.getServer();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});