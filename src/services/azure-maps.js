import { config } from '../config.js';
import { HttpError } from '../http-error.js';

// No caching by design - every request hits Azure Maps directly.
async function callAzureMaps(path, params) {
  const url = new URL(`${config.azureMaps.baseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('subscription-key', config.azureMaps.key);

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(config.azureMaps.timeoutMs)
    });
  } catch (error) {
    throw new HttpError(
      504,
      `Azure Maps request failed: ${error.message}`,
      'azure_maps_unreachable'
    );
  }

  if (!response.ok) {
    // Never surface the raw upstream body - it can echo the subscription key.
    throw new HttpError(502, `Azure Maps returned HTTP ${response.status}.`, 'azure_maps_error');
  }

  return response.json();
}

export async function geocodeCity({ city, country, countryCode }) {
  const data = await callAzureMaps('/search/address/json', {
    'api-version': '1.0',
    query: `${city}, ${country}`,
    countrySet: countryCode,
    limit: '1',
    typeahead: 'false'
  });

  const match = data?.results?.[0];
  if (!match?.position) {
    throw new HttpError(
      502,
      `Azure Maps could not resolve coordinates for ${city}, ${country}.`,
      'geocode_failed'
    );
  }

  return {
    latitude: match.position.lat,
    longitude: match.position.lon,
    resolvedAddress: match.address?.freeformAddress ?? `${city}, ${country}`
  };
}

export async function getCurrentConditions({ latitude, longitude }) {
  const data = await callAzureMaps('/weather/currentConditions/json', {
    'api-version': '1.1',
    query: `${latitude},${longitude}`,
    unit: 'metric',
    details: 'true'
  });

  const current = data?.results?.[0];
  if (!current) {
    throw new HttpError(502, 'Azure Maps returned no weather data.', 'weather_unavailable');
  }

  return {
    observedAt: current.dateTime,
    phrase: current.phrase,
    iconCode: current.iconCode,
    isDayTime: current.isDayTime,
    temperatureC: current.temperature?.value,
    feelsLikeC: current.realFeelTemperature?.value,
    humidityPercent: current.relativeHumidity,
    windSpeedKmh: current.wind?.speed?.value,
    windDirection: current.wind?.direction?.localizedDescription,
    uvIndex: current.uvIndex,
    uvIndexPhrase: current.uvIndexPhrase,
    pressureMb: current.pressure?.value,
    visibilityKm: current.visibility?.value
  };
}
