import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { WeatherService } from '../services/WeatherService.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { weatherQuerySchema } from '@/utils/validation.js';

export class WeatherController {
  private databaseService = new DatabaseService();
  private weatherService = new WeatherService();

  async getWeatherForecasts(req: Request, res: Response) {
    try {
      const { error, value } = weatherQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.details.map((d: any) => d.message)
        } as ApiResponse);
      }

      const { location, days } = value;
      const forecasts = await this.databaseService.getWeatherForecasts(location, days);

      return res.json({
        success: true,
        data: forecasts
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching weather forecasts', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch weather forecasts'
      } as ApiResponse);
    }
  }

  async refreshWeatherData(req: Request, res: Response) {
    try {
      await this.weatherService.fetchAndStoreWeatherData();

      return res.json({
        success: true,
        message: 'Weather data refreshed successfully'
      } as ApiResponse);
    } catch (error) {
      logger.error('Error refreshing weather data', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to refresh weather data'
      } as ApiResponse);
    }
  }
}