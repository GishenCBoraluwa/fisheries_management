import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();
const databaseService = new DatabaseService();

// Get all fish types
router.get('/', async (req, res) => {
  try {
    const fishTypes = await databaseService.getAllFishTypes();
    
    return res.json({
      success: true,
      data: fishTypes,
      count: fishTypes.length
    } as ApiResponse);
  } catch (error) {
    logger.error('Error fetching fish types', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch fish types'
    } as ApiResponse);
  }
});

export default router;