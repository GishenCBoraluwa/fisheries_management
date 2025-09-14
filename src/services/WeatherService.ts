import axios from 'axios';
import prisma from '../config/database.js';
import { WeatherApiResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';

export class WeatherService {
  private readonly apiUrl = process.env.WEATHER_API_URL || 'https://api.open-meteo.com/v1';
  
  private readonly locations = [
    { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
    { name: 'Negombo', lat: 7.2084, lng: 79.8358 },
    { name: 'Galle', lat: 6.0535, lng: 80.2210 },
    { name: 'Trincomalee', lat: 8.5874, lng: 81.2152 },
    { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
    { name: 'Hambantota', lat: 6.1241, lng: 81.1185 }
  ];

  async fetchAndStoreWeatherData(): Promise<void> {
    logger.info('Starting weather data fetch process');

    for (const location of this.locations) {
      try {
        await this.fetchLocationWeather(location);
      } catch (error) {
        logger.error(`Failed to fetch weather for ${location.name}`, error);
      }
    }

    logger.info('Weather data fetch process completed');
  }

  private async fetchLocationWeather(location: { name: string; lat: number; lng: number }) {
    try {
      const response = await axios.get<WeatherApiResponse>(`${this.apiUrl}/forecast`, {
        params: {
          latitude: location.lat,
          longitude: location.lng,
          daily: [
            'temperature_2m_mean',
            'wind_speed_10m_max',
            'wind_gusts_10m_max',
            'cloud_cover_mean',
            'precipitation_sum',
            'relative_humidity_2m_mean'
          ].join(','),
          forecast_days: 7,
          timezone: 'Asia/Colombo'
        },
        timeout: 10000
      });

      const weatherData = response.data;
      
      // Fixed: Safe array access with proper null checking
      if (!weatherData.daily?.time || weatherData.daily.time.length === 0) {
        throw new Error('No weather data received');
      }
      
      // Store weather forecasts with safe array access
      for (let i = 0; i < weatherData.daily.time.length; i++) {
        const timeValue = weatherData.daily.time[i];
        if (!timeValue) {
          logger.warn(`Skipping weather entry ${i} - no time value`);
          continue;
        }

        const forecastDate = new Date(timeValue);
        if (isNaN(forecastDate.getTime())) {
          logger.warn(`Invalid date format: ${timeValue}`);
          continue;
        }
        
        // Safe array access with fallback values
        const temperature = weatherData.daily.temperature_2m_mean?.[i] ?? 27.0;
        const windSpeed = weatherData.daily.wind_speed_10m_max?.[i] ?? 15.0;
        const precipitation = weatherData.daily.precipitation_sum?.[i] ?? 0.0;
        const humidity = weatherData.daily.relative_humidity_2m_mean?.[i] ?? 80.0;

        await prisma.weatherForecast.upsert({
          where: {
            forecastDate_latitude_longitude: {
              forecastDate,
              latitude: location.lat,
              longitude: location.lng
            }
          },
          update: {
            temperature2mMean: temperature,
            windSpeed10mMax: windSpeed,
            precipitationSum: precipitation,
            relativeHumidity2mMean: humidity
          },
          create: {
            forecastDate,
            location: location.name,
            latitude: location.lat,
            longitude: location.lng,
            temperature2mMean: temperature,
            windSpeed10mMax: windSpeed,
            precipitationSum: precipitation,
            relativeHumidity2mMean: humidity
          }
        });
      }

      logger.info(`Weather data stored for ${location.name}`);
    } catch (error) {
      logger.error(`Error fetching weather for ${location.name}`, error);
      throw error;
    }
  }

  async getAverageWeatherData(): Promise<Record<string, number>> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const averageData = await prisma.weatherForecast.aggregate({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _avg: {
        temperature2mMean: true,
        windSpeed10mMax: true,
        precipitationSum: true,
        relativeHumidity2mMean: true
      }
    });

    return {
      temperature_2m_mean: Number(averageData._avg.temperature2mMean ?? 27),
      wind_speed_10m_max: Number(averageData._avg.windSpeed10mMax ?? 15),
      precipitation_sum: Number(averageData._avg.precipitationSum ?? 2),
      relative_humidity_2m_mean: Number(averageData._avg.relativeHumidity2mMean ?? 80)
    };
  }
}