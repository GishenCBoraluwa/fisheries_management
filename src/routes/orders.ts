import { Router } from 'express';
import { OrderController } from '../controllers/OrderController.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.js';

import Joi from 'joi';
import { createOrderSchema, paginationSchema } from '@/utils/validation.js';

const router = Router();
const orderController = new OrderController();

const orderIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// Create new order (multi-item support)
router.post('/', 
  validateBody(createOrderSchema),
  (req, res) => orderController.createOrder(req, res)
);

// Get pending orders with pagination
router.get('/pending', 
  validateQuery(paginationSchema),
  (req, res) => orderController.getPendingOrders(req, res)
);

// Get latest transactions
router.get('/transactions/latest', 
  validateQuery(paginationSchema),
  (req, res) => orderController.getLatestTransactions(req, res)
);

// Get order by ID
router.get('/:id', 
  validateParams(orderIdSchema),
  (req, res) => orderController.getOrderById(req, res)
);

export default router;