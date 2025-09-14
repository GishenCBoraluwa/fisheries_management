import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { createOrderSchema, paginationSchema } from '../utils/validation.js';
import { ApiResponse, CreateOrderRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { safeParseInt } from '../middleware/validation.js';

export class OrderController {
  private databaseService = new DatabaseService();

  async createOrder(req: Request, res: Response) {
    try {
      const { error, value } = createOrderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map((d: any) => d.message)
        } as ApiResponse);
      }

      const orderData: CreateOrderRequest = value;
      const result = await this.databaseService.createOrder(orderData);

      logger.info(`Order created successfully`, { orderId: result.order.id });

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: result
      } as ApiResponse);
    } catch (error) {
      logger.error('Error creating order', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create order'
      } as ApiResponse);
    }
  }

  async getOrderById(req: Request, res: Response) {
    try {
      // Use safe parameter extraction
      const orderId = safeParseInt(req.params.id, 'order ID');

      const order = await this.databaseService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        } as ApiResponse);
      }

      return res.json({
        success: true,
        data: order
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching order', error);
      
      // Handle parameter validation errors
      if (error instanceof Error && error.message.includes('parameter')) {
        return res.status(400).json({
          success: false,
          message: error.message
        } as ApiResponse);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order'
      } as ApiResponse);
    }
  }

  async getPendingOrders(req: Request, res: Response) {
    try {
      const { error, value } = paginationSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          errors: error.details.map((d: any) => d.message)
        } as ApiResponse);
      }

      const result = await this.databaseService.getPendingOrders(value);
      
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching pending orders', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch pending orders'
      } as ApiResponse);
    }
  }

  async getLatestTransactions(req: Request, res: Response) {
    try {
      const { error, value } = paginationSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          errors: error.details.map((d: any) => d.message)
        } as ApiResponse);
      }

      const result = await this.databaseService.getLatestTransactions(value);
      
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching latest transactions', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch latest transactions'
      } as ApiResponse);
    }
  }
}
