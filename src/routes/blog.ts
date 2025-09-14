import { Router } from 'express';
import { BlogController } from '../controllers/BlogController.js';
import { validateQuery, validateParams } from '../middleware/validation.js';
import Joi from 'joi';
import { blogQuerySchema } from '@/utils/validation.js';

const router = Router();
const blogController = new BlogController();

const slugSchema = Joi.object({
  slug: Joi.string().min(1).required()
});

// Get all blog posts with filtering and pagination
router.get('/', 
  validateQuery(blogQuerySchema),
  (req, res) => blogController.getAllPosts(req, res)
);

// Get specific blog post by slug
router.get('/:slug', 
  validateParams(slugSchema),
  (req, res) => blogController.getPostBySlug(req, res)
);

export default router;