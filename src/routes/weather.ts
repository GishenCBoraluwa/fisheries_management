import { Router } from 'express';
import { WeatherController } from '../controllers/WeatherController.js';
import { validateQuery } from '../middleware/validation.js';
import { weatherQuerySchema } from '@/utils/validation.js';

const router = Router();
const weatherController = new WeatherController();

// Get weather forecasts
router.get('/forecasts', 
  validateQuery(weatherQuerySchema),
  (req, res) => weatherController.getWeatherForecasts(req, res)
);

// Refresh weather data manually
router.post('/refresh', 
  (req, res) => weatherController.refreshWeatherData(req, res)
);

export default router;