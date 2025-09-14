import Joi from 'joi';
import { CreateOrderRequest } from '../types/index.js';

export const createOrderSchema = Joi.object<CreateOrderRequest>({
  userId: Joi.number().integer().positive().required(),
  deliveryDate: Joi.date().iso().min('now').required(),
  deliveryTimeSlot: Joi.string().optional(),
  freshnessRequirementHours: Joi.number().integer().min(1).max(168).default(24),
  deliveryLatitude: Joi.number().min(-90).max(90).required(),
  deliveryLongitude: Joi.number().min(-180).max(180).required(),
  deliveryAddress: Joi.string().min(10).max(500).required(),
  orderItems: Joi.array().items(
    Joi.object({
      fishTypeId: Joi.number().integer().positive().required(),
      quantityKg: Joi.number().positive().max(1000).required(),
      unitPrice: Joi.number().positive().required()
    })
  ).min(1).max(10).required(),
  specialInstructions: Joi.string().max(500).optional()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

export const fishPricesQuerySchema = Joi.object({
  fishTypeId: Joi.number().integer().positive().optional(),
  days: Joi.number().integer().min(1).max(365).default(30)
});

export const addPriceSchema = Joi.object({
  fishTypeId: Joi.number().integer().positive().required(),
  priceDate: Joi.date().iso().max('now').required(),
  retailPrice: Joi.number().positive().required(),
  wholesalePrice: Joi.number().positive().required(),
  marketDemandLevel: Joi.string().valid('low', 'medium', 'high').default('medium'),
  supplyAvailability: Joi.number().integer().min(0).default(0)
});

export const weatherQuerySchema = Joi.object({
  location: Joi.string().optional(),
  days: Joi.number().integer().min(1).max(14).default(7)
});

export const blogQuerySchema = Joi.object({
  category: Joi.string().valid('policy', 'climate_change', 'overfishing', 'iuu_fishing').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

// Helper function for safe validation
export function validateAndThrow<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(`Validation failed: ${error.details.map(d => d.message).join(', ')}`);
  }
  return value;
}