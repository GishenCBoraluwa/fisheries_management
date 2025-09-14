import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types/index.js';

// Extend Express Request type to include validated data
interface ValidatedRequest extends Request {
  validatedParams?: any;
  validatedBody?: any;
  validatedQuery?: any;
}

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((detail) => detail.message)
      } as ApiResponse);
      return;
    }
    
    req.body = value;
    req.validatedBody = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: error.details.map((detail) => detail.message)
      } as ApiResponse);
      return;
    }
    
    req.query = value;
    req.validatedQuery = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: ValidatedRequest, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors: error.details.map((detail) => detail.message)
      } as ApiResponse);
      return;
    }
    
    req.params = value;
    req.validatedParams = value;
    next();
  };
};

// Helper function for safe parameter extraction
export const safeParseInt = (value: string | undefined, paramName: string): number => {
  if (!value) {
    throw new Error(`${paramName} parameter is required`);
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid ${paramName} format`);
  }
  
  return parsed;
};
