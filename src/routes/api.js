import { Router } from 'express';
import { CITIES, findCity } from '../data/cities.js';
import { HttpError } from '../http-error.js';
import {
  MAX_FORECAST_DAYS,
  geocodeCity,
  getCurrentConditions,
  getDailyForecast
} from '../services/azure-maps.js';

export const router = Router();

function resolveCity(query) {
  const { city, country } = query;

  if (typeof city !== 'string' || !city.trim()) {
    throw new HttpError(400, 'Query parameter "city" is required.', 'missing_city');
  }
  if (country !== undefined && typeof country !== 'string') {
    throw new HttpError(400, 'Query parameter "country" must be a single value.', 'invalid_country');
  }

  const match = findCity(city, country);
  if (!match) {
    throw new HttpError(
      404,
      `Unsupported location "${city}${country ? `, ${country}` : ''}". Supported cities: ${CITIES
        .map((entry) => `${entry.city}, ${entry.country}`)
        .join('; ')}.`,
      'unsupported_city'
    );
  }

  return match;
}

function parseDays(value) {
  if (value === undefined) return 5;

  const days = Number(value);
  if (!Number.isInteger(days) || days < 1 || days > MAX_FORECAST_DAYS) {
    throw new HttpError(
      400,
      `Query parameter "days" must be an integer between 1 and ${MAX_FORECAST_DAYS}.`,
      'invalid_days'
    );
  }
  return days;
}

router.get('/cities', (_req, res) => {
  res.json({ cities: CITIES });
});

router.get('/weather', async (req, res, next) => {
  try {
    const match = resolveCity(req.query);
    const location = await geocodeCity(match);
    const weather = await getCurrentConditions(location);

    res.json({
      city: match.city,
      country: match.country,
      countryCode: match.countryCode,
      flag: match.flag,
      timezone: match.timezone,
      coordinates: { latitude: location.latitude, longitude: location.longitude },
      resolvedAddress: location.resolvedAddress,
      weather,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

router.get('/forecast', async (req, res, next) => {
  try {
    const match = resolveCity(req.query);
    const days = parseDays(req.query.days);
    const location = await geocodeCity(match);
    const forecast = await getDailyForecast(location, days);

    res.json({
      city: match.city,
      country: match.country,
      countryCode: match.countryCode,
      timezone: match.timezone,
      coordinates: { latitude: location.latitude, longitude: location.longitude },
      days: forecast.length,
      forecast,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});
