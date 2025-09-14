import { Router } from 'express';
import ordersRouter from './orders.js';
import pricingRouter from './pricing.js';
import weatherRouter from './weather.js';
import blogRouter from './blog.js';
import fishTypesRouter from './fishTypes.js';
import usersRouter from './users.js';
import dashboardRouter from './dashboard.js';
import settingsRouter from './settings.js';

const router = Router();

// Mount all route modules
router.use('/orders', ordersRouter);
router.use('/pricing', pricingRouter);
router.use('/weather', weatherRouter);
router.use('/blog', blogRouter);
router.use('/fish-types', fishTypesRouter);
router.use('/users', usersRouter);
router.use('/dashboard', dashboardRouter);
router.use('/settings', settingsRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fisheries Management API v1.0',
    endpoints: {
      health: 'GET /api/v1/health',
      orders: 'GET/POST /api/v1/orders',
      pricing: 'GET/POST /api/v1/pricing',
      weather: 'GET /api/v1/weather',
      blog: 'GET /api/v1/blog',
      fishTypes: 'GET /api/v1/fish-types',
      users: 'GET /api/v1/users',
      dashboard: 'GET /api/v1/dashboard',
      settings: 'GET/PUT /api/v1/settings'
    }
  });
});

export default router;