import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController.js';

const router = Router();
const dashboardController = new DashboardController();

// Main dashboard stats
router.get('/stats', (req, res) => dashboardController.getDashboardStats(req, res));

// Revenue analytics
router.get('/revenue', (req, res) => dashboardController.getRevenueData(req, res));

// Fish sales analytics
router.get('/fish-sales', (req, res) => dashboardController.getFishSalesData(req, res));

// Truck information
router.get('/trucks', (req, res) => dashboardController.getTruckInfo(req, res));

// Orders by status
router.get('/orders', (req, res) => dashboardController.getOrdersByStatus(req, res));

export default router;