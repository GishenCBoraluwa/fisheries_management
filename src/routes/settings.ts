import { Router } from 'express';
import { validateParams, validateBody } from '../middleware/validation.js';
import { ApiResponse, UserSettings } from '../types/index.js';
import { logger } from '../utils/logger.js';
import Joi from 'joi';

const router = Router();

// Mock user settings storage (in production, store in database)
const userSettings = new Map<number, UserSettings>();

const userIdSchema = Joi.object({
  userId: Joi.number().integer().positive().required()
});

const settingsSchema = Joi.object({
  notifications: Joi.object({
    email: Joi.boolean().default(true),
    sms: Joi.boolean().default(false),
    push: Joi.boolean().default(true)
  }).optional(),
  preferences: Joi.object({
    currency: Joi.string().valid('LKR', 'USD').default('LKR'),
    language: Joi.string().valid('en', 'si', 'ta').default('en'),
    timezone: Joi.string().default('Asia/Colombo')
  }).optional(),
  delivery: Joi.object({
    defaultAddress: Joi.string().optional(),
    preferredTimeSlot: Joi.string().valid('morning', 'afternoon', 'evening').optional(),
    specialInstructions: Joi.string().max(500).optional()
  }).optional()
});

// Get user settings - Fixed TypeScript handling
router.get('/:userId', 
  validateParams(userIdSchema),
  (req, res) => {
    try {
      // After validation middleware, we know req.params.userId exists and is valid
      const userIdParam = req.params.userId;
      if (!userIdParam) {
        return res.status(400).json({
          success: false,
          message: 'User ID parameter is required'
        } as ApiResponse);
      }

      const userId = parseInt(userIdParam, 10);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        } as ApiResponse);
      }

      const settings = userSettings.get(userId) || {
        notifications: { email: true, sms: false, push: true },
        preferences: { currency: 'LKR', language: 'en', timezone: 'Asia/Colombo' },
        delivery: {}
      };

      return res.json({
        success: true,
        data: settings
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching user settings', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user settings'
      } as ApiResponse);
    }
  }
);

// Update user settings - Fixed TypeScript handling
router.put('/:userId', 
  validateParams(userIdSchema),
  validateBody(settingsSchema),
  (req, res) => {
    try {
      // After validation middleware, we know req.params.userId exists and is valid
      const userIdParam = req.params.userId;
      if (!userIdParam) {
        return res.status(400).json({
          success: false,
          message: 'User ID parameter is required'
        } as ApiResponse);
      }

      const userId = parseInt(userIdParam, 10);
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        } as ApiResponse);
      }

      const currentSettings = userSettings.get(userId) || {
        notifications: { email: true, sms: false, push: true },
        preferences: { currency: 'LKR', language: 'en', timezone: 'Asia/Colombo' },
        delivery: {}
      };

      // Merge with existing settings
      const updatedSettings: UserSettings = {
        notifications: { ...currentSettings.notifications, ...req.body.notifications },
        preferences: { ...currentSettings.preferences, ...req.body.preferences },
        delivery: { ...currentSettings.delivery, ...req.body.delivery }
      };

      userSettings.set(userId, updatedSettings);

      logger.info(`Settings updated for user ${userId}`, updatedSettings);

      return res.json({
        success: true,
        message: 'Settings updated successfully',
        data: updatedSettings
      } as ApiResponse);
    } catch (error) {
      logger.error('Error updating user settings', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user settings'
      } as ApiResponse);
    }
  }
);

export default router;
