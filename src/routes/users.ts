import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { validateQuery, validateParams } from '../middleware/validation.js';
import { paginationSchema } from '../utils/validation.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import Joi from 'joi';

const router = Router();
const databaseService = new DatabaseService();

const userIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// Get all users with pagination
router.get('/', 
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const result = await databaseService.getAllUsers(req.query as any);
      
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching users', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      } as ApiResponse);
    }
  }
);

// Get user by ID - Fixed TypeScript handling
router.get('/:id', 
  validateParams(userIdSchema),
  async (req, res) => {
    try {
      // After validation middleware, we know req.params.id exists and is valid
      const idParam = req.params.id;
      if (!idParam) {
        return res.status(400).json({
          success: false,
          message: 'User ID parameter is required'
        } as ApiResponse);
      }

      const userId = parseInt(idParam, 10);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        } as ApiResponse);
      }

      const user = await databaseService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
      }

      return res.json({
        success: true,
        data: user
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching user', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      } as ApiResponse);
    }
  }
);

export default router;