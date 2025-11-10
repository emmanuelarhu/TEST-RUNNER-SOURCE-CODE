import dotenv from 'dotenv';
import { initializeDatabase } from './models/database.schema';
import { seedDatabase } from './seed-data';
import logger from './config/logger';

// Load environment variables
dotenv.config();

const runSeed = async () => {
  try {
    logger.info('🚀 Starting database initialization and seeding...');

    // Initialize database schema
    await initializeDatabase();

    // Seed with sample data
    await seedDatabase();

    logger.info('✨ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to setup database:', error);
    process.exit(1);
  }
};

runSeed();
