import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { blogQuerySchema } from '@/utils/validation.js';

export class BlogController {
  private databaseService = new DatabaseService();

  async getAllPosts(req: Request, res: Response) {
    try {
      const { error, value } = blogQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.details.map((d: any) => d.message)
        } as ApiResponse);
      }

      const { category, page, limit } = value;
      const result = await this.databaseService.getAllBlogPosts(category, { page, limit });

      // Fixed: Handle both array and paginated response types properly
      if (Array.isArray(result)) {
        return res.json({
          success: true,
          data: result
        } as ApiResponse);
      } else {
        return res.json({
          success: true,
          data: result.data,
          pagination: result.pagination
        } as ApiResponse);
      }
    } catch (error) {
      logger.error('Error fetching blog posts', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch blog posts'
      } as ApiResponse);
    }
  }

  async getPostBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      if (!slug || slug.length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid slug parameter'
        } as ApiResponse);
      }

      const post = await this.databaseService.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        } as ApiResponse);
      }

      return res.json({
        success: true,
        data: post
      } as ApiResponse);
    } catch (error) {
      logger.error('Error fetching blog post', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch blog post'
      } as ApiResponse);
    }
  }
}