import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  currentConditionsResponse,
  dailyForecastResponse,
  searchAddressResponse
} from '../fixtures/azure-maps.js';
import { AZURE_MAPS_PATHS, stubAzureMaps } from '../helpers/fetch-mock.js';

const app = createApp();

function stubHappyPath() {
  return stubAzureMaps({
    [AZURE_MAPS_PATHS.search]: searchAddressResponse,
    [AZURE_MAPS_PATHS.currentConditions]: currentConditionsResponse,
    [AZURE_MAPS_PATHS.dailyForecast]: dailyForecastResponse(10)
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/cities', () => {
  it('returns the supported reference data', async () => {
    const response = await request(app).get('/api/cities').expect(200);

    expect(Array.isArray(response.body.cities)).toBe(true);
    expect(response.body.cities.length).toBeGreaterThan(0);
    expect(response.body.cities[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        city: expect.any(String),
        country: expect.any(String),
        countryCode: expect.any(String),
        timezone: expect.any(String),
        coordinates: expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number)
        })
      })
    );
  });
});

describe('GET /api/weather', () => {
  it('geocodes the city and returns its current conditions', async () => {
    stubHappyPath();

    const response = await request(app)
      .get('/api/weather')
      .query({ city: 'Sydney', country: 'AU' })
      .expect(200);

    expect(response.body).toMatchObject({
      city: 'Sydney',
      country: 'Australia',
      countryCode: 'AU',
      resolvedAddress: 'Sydney, New South Wales',
      coordinates: { latitude: -33.86785, longitude: 151.20732 }
    });
    expect(response.body.weather).toMatchObject({ temperatureC: 22.3, humidityPercent: 55 });
  });

  it('accepts the full country name and is case-insensitive', async () => {
    stubHappyPath();

    await request(app)
      .get('/api/weather')
      .query({ city: 'sydney', country: 'australia' })
      .expect(200);
  });

  it('rejects a missing city with 400', async () => {
    const response = await request(app).get('/api/weather').expect(400);

    expect(response.body.error.code).toBe('missing_city');
  });

  it('rejects a blank city with 400', async () => {
    const response = await request(app).get('/api/weather').query({ city: '   ' }).expect(400);

    expect(response.body.error.code).toBe('missing_city');
  });

  it('rejects an unsupported city with 404 and lists the supported ones', async () => {
    const response = await request(app).get('/api/weather').query({ city: 'Atlantis' }).expect(404);

    expect(response.body.error.code).toBe('unsupported_city');
    expect(response.body.error.message).toContain('Supported cities');
  });

  it('rejects a supported city paired with the wrong country with 404', async () => {
    const response = await request(app)
      .get('/api/weather')
      .query({ city: 'Sydney', country: 'SG' })
      .expect(404);

    expect(response.body.error.code).toBe('unsupported_city');
  });

  it('does not call Azure Maps when validation fails', async () => {
    const fetchMock = stubHappyPath();

    await request(app).get('/api/weather').query({ city: 'Atlantis' }).expect(404);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('GET /api/forecast', () => {
  it('defaults to a 5 day forecast', async () => {
    stubHappyPath();

    const response = await request(app)
      .get('/api/forecast')
      .query({ city: 'Sydney', country: 'AU' })
      .expect(200);

    expect(response.body.days).toBe(5);
    expect(response.body.forecast).toHaveLength(5);
  });

  it('returns the requested number of days', async () => {
    stubHappyPath();

    const response = await request(app)
      .get('/api/forecast')
      .query({ city: 'Sydney', country: 'AU', days: 7 })
      .expect(200);

    expect(response.body.forecast).toHaveLength(7);
    expect(response.body.forecast[0]).toMatchObject({ uvIndex: 7, phrase: 'Mostly sunny' });
  });

  it.each(['0', '99', 'seven', '5.5'])('rejects days=%s with 400', async (days) => {
    const response = await request(app)
      .get('/api/forecast')
      .query({ city: 'Sydney', country: 'AU', days })
      .expect(400);

    expect(response.body.error.code).toBe('invalid_days');
  });

  it('rejects an unsupported city with 404', async () => {
    const response = await request(app).get('/api/forecast').query({ city: 'Atlantis' }).expect(404);

    expect(response.body.error.code).toBe('unsupported_city');
  });
});

describe('error handling', () => {
  it('surfaces upstream Azure Maps failures as 502', async () => {
    // The app logs 5xx failures; keep that expected noise out of the test output.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubAzureMaps({ [AZURE_MAPS_PATHS.search]: { results: [] } });

    const response = await request(app)
      .get('/api/weather')
      .query({ city: 'Sydney', country: 'AU' })
      .expect(502);

    expect(response.body.error.code).toBe('geocode_failed');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);

    expect(response.body.error.code).toBe('not_found');
  });

  it('answers the health probe', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' });
  });
});
