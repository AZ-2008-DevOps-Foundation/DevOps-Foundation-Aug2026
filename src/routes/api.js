import { Router } from 'express';
import { CITIES, findCity } from '../data/cities.js';
import { HttpError } from '../http-error.js';
import { geocodeCity, getCurrentConditions } from '../services/azure-maps.js';

export const router = Router();

router.get('/cities', (_req, res) => {
  res.json({ cities: CITIES });
});

router.get('/weather', async (req, res, next) => {
  try {
    const { city, country } = req.query;

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
