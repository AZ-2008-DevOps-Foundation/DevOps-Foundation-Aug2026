import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  geocodeCity,
  getCurrentConditions,
  getDailyForecast
} from '../../src/services/azure-maps.js';
import {
  currentConditionsResponse,
  dailyForecastResponse,
  searchAddressResponse
} from '../fixtures/azure-maps.js';
import { AZURE_MAPS_PATHS, jsonResponse, stubAzureMaps } from '../helpers/fetch-mock.js';

const SYDNEY = { city: 'Sydney', country: 'Australia', countryCode: 'AU' };
const COORDINATES = { latitude: -33.86785, longitude: 151.20732 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('geocodeCity', () => {
  it('parses coordinates and the resolved address from a Search response', async () => {
    stubAzureMaps({ [AZURE_MAPS_PATHS.search]: searchAddressResponse });

    await expect(geocodeCity(SYDNEY)).resolves.toEqual({
      latitude: -33.86785,
      longitude: 151.20732,
      resolvedAddress: 'Sydney, New South Wales'
    });
  });

  it('sends the city query, country filter and subscription key', async () => {
    const fetchMock = stubAzureMaps({ [AZURE_MAPS_PATHS.search]: searchAddressResponse });

    await geocodeCity(SYDNEY);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get('query')).toBe('Sydney, Australia');
    expect(url.searchParams.get('countrySet')).toBe('AU');
    expect(url.searchParams.has('subscription-key')).toBe(true);
  });

  it('falls back to the requested city when the address is missing', async () => {
    stubAzureMaps({
      [AZURE_MAPS_PATHS.search]: { results: [{ position: { lat: 1, lon: 2 } }] }
    });

    await expect(geocodeCity(SYDNEY)).resolves.toMatchObject({
      resolvedAddress: 'Sydney, Australia'
    });
  });

  it('fails with 502 when no result has a position', async () => {
    stubAzureMaps({ [AZURE_MAPS_PATHS.search]: { results: [] } });

    await expect(geocodeCity(SYDNEY)).rejects.toMatchObject({
      status: 502,
      code: 'geocode_failed'
    });
  });
});

describe('getCurrentConditions', () => {
  it('maps the Azure Maps payload onto the API contract', async () => {
    stubAzureMaps({ [AZURE_MAPS_PATHS.currentConditions]: currentConditionsResponse });

    await expect(getCurrentConditions(COORDINATES)).resolves.toEqual({
      observedAt: '2026-08-24T10:00:00+10:00',
      phrase: 'Sunny',
      iconCode: 1,
      isDayTime: true,
      temperatureC: 22.3,
      minTemperatureC: 12.4,
      maxTemperatureC: 23.9,
      feelsLikeC: 24.1,
      dewPointC: 11.2,
      humidityPercent: 55,
      windSpeedKmh: 12.5,
      windDirection: 'E',
      windGustKmh: 25.9,
      uvIndex: 6,
      uvIndexPhrase: 'High',
      cloudCoverPercent: 10,
      pressureMb: 1015.2,
      visibilityKm: 16.1,
      precipitationPastHourMm: 0.4
    });
  });

  it('leaves optional metrics undefined instead of throwing', async () => {
    stubAzureMaps({
      [AZURE_MAPS_PATHS.currentConditions]: {
        results: [{ phrase: 'Cloudy', iconCode: 7, temperature: { value: 18 } }]
      }
    });

    const weather = await getCurrentConditions(COORDINATES);

    expect(weather.temperatureC).toBe(18);
    expect(weather.humidityPercent).toBeUndefined();
    expect(weather.windSpeedKmh).toBeUndefined();
    expect(weather.minTemperatureC).toBeUndefined();
  });

  it('fails with 502 when the results array is empty', async () => {
    stubAzureMaps({ [AZURE_MAPS_PATHS.currentConditions]: { results: [] } });

    await expect(getCurrentConditions(COORDINATES)).rejects.toMatchObject({
      status: 502,
      code: 'weather_unavailable'
    });
  });
});

describe('getDailyForecast', () => {
  it('flattens each day and lifts the UV index out of airAndPollen', async () => {
    stubAzureMaps({ [AZURE_MAPS_PATHS.dailyForecast]: dailyForecastResponse() });

    const [first] = await getDailyForecast(COORDINATES, 5);

    expect(first).toMatchObject({
      date: '2026-08-24T07:00:00+10:00',
      minTemperatureC: 11,
      maxTemperatureC: 20,
      iconCode: 2,
      phrase: 'Mostly sunny',
      precipitationProbability: 15,
      precipitationMm: 1.2,
      windSpeedKmh: 14.8,
      windDirection: 'S',
      cloudCoverPercent: 25,
      hoursOfSun: 8.5,
      uvIndex: 7,
      uvIndexPhrase: 'High'
    });
  });

  it('trims the response to the requested number of days', async () => {
    stubAzureMaps({ [AZURE_MAPS_PATHS.dailyForecast]: dailyForecastResponse(10) });

    await expect(getDailyForecast(COORDINATES, 7)).resolves.toHaveLength(7);
  });

  it('requests the smallest supported duration that covers the range', async () => {
    const fetchMock = stubAzureMaps({
      [AZURE_MAPS_PATHS.dailyForecast]: dailyForecastResponse(10)
    });

    await getDailyForecast(COORDINATES, 5);
    await getDailyForecast(COORDINATES, 7);

    const durations = fetchMock.mock.calls.map(
      ([url]) => new URL(url).searchParams.get('duration')
    );
    expect(durations).toEqual(['5', '10']);
  });

  it('fails with 502 when no forecasts are returned', async () => {
    stubAzureMaps({ [AZURE_MAPS_PATHS.dailyForecast]: { forecasts: [] } });

    await expect(getDailyForecast(COORDINATES, 5)).rejects.toMatchObject({
      status: 502,
      code: 'forecast_unavailable'
    });
  });
});

describe('Azure Maps transport errors', () => {
  it('maps an upstream error status to 502 without leaking the response body', async () => {
    stubAzureMaps({
      [AZURE_MAPS_PATHS.search]: () =>
        jsonResponse({ error: { message: 'subscription-key=secret' } }, { status: 401 })
    });

    const error = await geocodeCity(SYDNEY).catch((thrown) => thrown);

    expect(error.status).toBe(502);
    expect(error.code).toBe('azure_maps_error');
    expect(error.message).toBe('Azure Maps returned HTTP 401.');
  });

  it('maps a network failure or timeout to 504', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('The operation was aborted due to timeout');
      })
    );

    await expect(geocodeCity(SYDNEY)).rejects.toMatchObject({
      status: 504,
      code: 'azure_maps_unreachable'
    });
  });
});
