import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import cron from 'node-cron';

import apiRoutes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { WeatherService } from './services/WeatherService.js';
import { PricePredictionService } from './services/PricePredictionService.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services for scheduled tasks
const weatherService = new WeatherService();
const predictionService = new PricePredictionService();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1', apiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Scheduled tasks
logger.info('Setting up scheduled tasks...');

// Weather data update - every 6 hours
cron.schedule('0 */6 * * *', async () => {
  logger.info('Running scheduled weather data update');
  try {
    await weatherService.fetchAndStoreWeatherData();
    logger.info('Scheduled weather update completed');
  } catch (error) {
    logger.error('Scheduled weather update failed', error);
  }
});

// Price predictions - daily at midnight
cron.schedule('0 0 * * *', async () => {
  logger.info('Running scheduled price predictions generation');
  try {
    await predictionService.generateDailyPredictions();
    logger.info('Scheduled price predictions completed');
  } catch (error) {
    logger.error('Scheduled price predictions failed', error);
  }
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Scheduled tasks configured successfully');
  logger.info(`API available at: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${String(promise)}, reason: ${String(reason)}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;