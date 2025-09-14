
import { Router } from 'express';
import { PricingController } from '../controllers/PricingController.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { fishPricesQuerySchema, addPriceSchema } from '../utils/validation.js';

const router = Router();
const pricingController = new PricingController();

// Get fish price history (last N days)
router.get('/history', 
  validateQuery(fishPricesQuerySchema),
  (req, res) => pricingController.getFishPricesHistory(req, res)
);

// Get current price predictions
router.get('/current', 
  (req, res) => pricingController.getCurrentPredictions(req, res)
);

// Add actual fish price (manual entry)
router.post('/actual', 
  validateBody(addPriceSchema),
  (req, res) => pricingController.addActualPrice(req, res)
);

export default router;