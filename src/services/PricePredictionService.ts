import axios from 'axios';
import prisma from '../config/database.js';
import { PredictionApiRequest, PredictionApiResponse } from '../types/api.js';
import { WeatherService } from './WeatherService.js';
import { logger } from '../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export class PricePredictionService {
  private readonly apiUrl = process.env.PREDICTION_API_URL || 'http://localhost:8000/api/v1/predictions';
  private readonly weatherService = new WeatherService();

  async generateDailyPredictions(): Promise<void> {
    logger.info('Starting daily price prediction generation');

    try {
      // Get all active fish types
      const fishTypes = await prisma.fishType.findMany({
        where: { isActive: true }
      });

      // Get averaged weather data
      const weatherData = await this.weatherService.getAverageWeatherData();
      
      // Mock economic data (integrate with actual economic APIs in production)
      const economicData = {
        dollar_rate: 302.30,
        kerosene_price: 185.00,
        diesel_lad_price: 283.00,
        super_diesel_lsd_price: 313.00
      };

      // Mock ocean data (integrate with marine weather APIs in production)
      const oceanData = {
        wave_height_max: 1.78,
        wind_wave_height_max: 0.64,
        swell_wave_height_max: 1.36,
        wave_period_max: 8.45,
        wave_direction_dominant: 252.29
      };

      // Generate predictions for each fish type
      for (const fishType of fishTypes) {
        try {
          await this.generatePredictionForFish(fishType.fishName, weatherData, oceanData, economicData);
          logger.info(`Generated predictions for ${fishType.fishName}`);
        } catch (error) {
          logger.error(`Failed to generate predictions for ${fishType.fishName}`, error);
        }
      }

      logger.info('Daily price prediction generation completed');
    } catch (error) {
      logger.error('Failed to generate daily predictions', error);
      throw error;
    }
  }

  private async generatePredictionForFish(
    fishName: string,
    weatherData: Record<string, number>,
    oceanData: Record<string, number>,
    economicData: Record<string, number>
  ): Promise<void> {
    const requestData: PredictionApiRequest = {
      fish_type: fishName,
      prediction_days: 7,
      weather_data: weatherData,
      ocean_data: oceanData,
      economic_data: economicData
    };

    try {
      const response = await axios.post<PredictionApiResponse>(
        `${this.apiUrl}/predict`,
        requestData,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await this.storePredictions(fishName, response.data);
      } else {
        throw new Error(`Prediction API returned success: false for ${fishName}`);
      }
    } catch (error) {
      logger.error(`Error calling prediction API for ${fishName}`, error);
      throw error;
    }
  }

  private async storePredictions(fishName: string, predictionData: PredictionApiResponse): Promise<void> {
    const fishType = await prisma.fishType.findFirst({
      where: { fishName }
    });

    if (!fishType) {
      throw new Error(`Fish type not found: ${fishName}`);
    }

    const { predictions } = predictionData;
    const today = new Date();

    // Fixed: Safe array access with proper length checking
    if (!predictions.avg_ws_price || !predictions.avg_rt_price) {
      throw new Error('Invalid prediction data structure');
    }

    const maxLength = Math.min(predictions.avg_ws_price.length, predictions.avg_rt_price.length, 7);

    // Store predictions for the next 7 days with safe array access
    for (let i = 0; i < maxLength; i++) {
      const predictionDate = new Date(today);
      predictionDate.setDate(today.getDate() + i);

      const retailPrice = predictions.avg_rt_price[i];
      const wholesalePrice = predictions.avg_ws_price[i];

      // Skip if prices are undefined
      if (retailPrice === undefined || wholesalePrice === undefined) {
        logger.warn(`Skipping prediction day ${i} - undefined prices`);
        continue;
      }

      await prisma.dailyPricePrediction.upsert({
        where: {
          fishTypeId_predictionDate: {
            fishTypeId: fishType.id,
            predictionDate
          }
        },
        update: {
          retailPrice: new Decimal(retailPrice),
          wholesalePrice: new Decimal(wholesalePrice),
          confidence: new Decimal(0.95)
        },
        create: {
          fishTypeId: fishType.id,
          predictionDate,
          retailPrice: new Decimal(retailPrice),
          wholesalePrice: new Decimal(wholesalePrice),
          confidence: new Decimal(0.95)
        }
      });
    }
  }

  async getCurrentPredictions(fishTypeId?: number) {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const where = {
      predictionDate: {
        gte: today,
        lte: sevenDaysFromNow
      },
      ...(fishTypeId && { fishTypeId })
    };

    return await prisma.dailyPricePrediction.findMany({
      where,
      include: {
        fishType: true
      },
      orderBy: { predictionDate: 'asc' }
    });
  }
}