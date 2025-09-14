import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { paginationSchema } from '@/utils/validation.js';

export class DashboardController {
  private databaseService = new DatabaseService();

  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await this.databaseService.getDashboardStats();

      return res.json({
        success: true,
        data: stats
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching dashboard stats', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      } as ApiResponse);
    }
  }

  async getRevenueData(req: Request, res: Response) {
    try {
      const revenueData = await this.databaseService.getRevenueData();

      return res.json({
        success: true,
        data: revenueData
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching revenue data', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue data'
      } as ApiResponse);
    }
  }

  async getFishSalesData(req: Request, res: Response) {
    try {
      const salesData = await this.databaseService.getFishSalesData();

      return res.json({
        success: true,
        data: salesData
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching fish sales data', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch fish sales data'
      } as ApiResponse);
    }
  }

  // Additional dashboard endpoints for complete functionality
  async getTruckInfo(req: Request, res: Response) {
    try {
      const trucks = await this.databaseService.getTruckInfo();

      return res.json({
        success: true,
        data: trucks
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching truck info', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch truck information'
      } as ApiResponse);
    }
  }

  async getOrdersByStatus(req: Request, res: Response) {
    try {
      const { error, value } = paginationSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          errors: error.details.map((d: any) => d.message)
        } as ApiResponse);
      }

      const status = req.query.status as string;
      const statusArray = status ? status.split(',') : ['pending', 'scheduled', 'in_progress'];

      const result = await this.databaseService.getOrdersByStatus(statusArray, value);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching orders by status', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      } as ApiResponse);
    }
  }
}