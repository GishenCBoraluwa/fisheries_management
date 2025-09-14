import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { PricePredictionService } from '../services/PricePredictionService.js';
import { fishPricesQuerySchema, addPriceSchema } from '../utils/validation.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { extractOptionalId } from '../utils/typeGuards.js';

export class PricingController {
  private databaseService = new DatabaseService();
  private predictionService = new PricePredictionService();

  async getFishPricesHistory(req: Request, res: Response) {
    try {
      const { error, value } = fishPricesQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.details.map((d: any) => d.message)
        } as ApiResponse);
      }

      const { fishTypeId, days } = value;
      const prices = await this.databaseService.getFishPricesHistory(fishTypeId, days);

      return res.json({
        success: true,
        data: prices
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching fish prices history', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch price history'
      } as ApiResponse);
    }
  }

  async getCurrentPredictions(req: Request, res: Response) {
    try {
      // Safe extraction of optional fishTypeId
      const fishTypeId = extractOptionalId(req.query.fishTypeId as string | undefined);

      const predictions = await this.predictionService.getCurrentPredictions(fishTypeId);

      return res.json({
        success: true,
        data: predictions
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching current predictions', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch price predictions'
      } as ApiResponse);
    }
  }

  async addActualPrice(req: Request, res: Response) {
    try {
      const { error, value } = addPriceSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map((d: any) => d.message)
        } as ApiResponse);
      }

      const result = await this.databaseService.addFishPrice({
        ...value,
        priceDate: new Date(value.priceDate),
        isActual: true
      });

      logger.info(`Actual price added for fish type ${value.fishTypeId}`);

      return res.status(201).json({
        success: true,
        message: 'Price added successfully',
        data: result
      } as ApiResponse);
    } catch (error) {
      logger.error('Error adding actual price', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add price'
      } as ApiResponse);
    }
  }
}