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

  const past24Hour = current.temperatureSummary?.past24Hour;

  return {
    observedAt: current.dateTime,
    phrase: current.phrase,
    iconCode: current.iconCode,
    isDayTime: current.isDayTime,
    temperatureC: current.temperature?.value,
    minTemperatureC: past24Hour?.minimum?.value,
    maxTemperatureC: past24Hour?.maximum?.value,
    feelsLikeC: current.realFeelTemperature?.value,
    dewPointC: current.dewPoint?.value,
    humidityPercent: current.relativeHumidity,
    windSpeedKmh: current.wind?.speed?.value,
    windDirection: current.wind?.direction?.localizedDescription,
    windGustKmh: current.windGust?.speed?.value,
    uvIndex: current.uvIndex,
    uvIndexPhrase: current.uvIndexPhrase,
    cloudCoverPercent: current.cloudCover,
    pressureMb: current.pressure?.value,
    visibilityKm: current.visibility?.value,
    precipitationPastHourMm: current.precipitationSummary?.pastHour?.value
  };
}

// Azure Maps only accepts a fixed set of forecast durations, so request the
// smallest one that covers the requested number of days and trim the rest.
const SUPPORTED_DURATIONS = [1, 5, 10, 15];

export const MAX_FORECAST_DAYS = 15;

function mapDailyForecast(entry) {
  const day = entry.day ?? {};
  const uv = entry.airAndPollen?.find((item) => item.name === 'UVIndex');

  return {
    date: entry.date,
    minTemperatureC: entry.temperature?.minimum?.value,
    maxTemperatureC: entry.temperature?.maximum?.value,
    feelsLikeMinC: entry.realFeelTemperature?.minimum?.value,
    feelsLikeMaxC: entry.realFeelTemperature?.maximum?.value,
    iconCode: day.iconCode,
    phrase: day.iconPhrase ?? day.shortPhrase,
    longPhrase: day.longPhrase,
    precipitationProbability: day.precipitationProbability,
    precipitationMm: day.totalLiquid?.value,
    hoursOfPrecipitation: day.hoursOfPrecipitation,
    windSpeedKmh: day.wind?.speed?.value,
    windDirection: day.wind?.direction?.localizedDescription,
    windGustKmh: day.windGust?.speed?.value,
    cloudCoverPercent: day.cloudCover,
    hoursOfSun: entry.hoursOfSun,
    uvIndex: uv?.value,
    uvIndexPhrase: uv?.category
  };
}

export async function getDailyForecast({ latitude, longitude }, days) {
  const duration = SUPPORTED_DURATIONS.find((value) => value >= days) ?? MAX_FORECAST_DAYS;

  const data = await callAzureMaps('/weather/forecast/daily/json', {
    'api-version': '1.1',
    query: `${latitude},${longitude}`,
    unit: 'metric',
    duration: String(duration)
  });

  if (!Array.isArray(data?.forecasts) || data.forecasts.length === 0) {
    throw new HttpError(502, 'Azure Maps returned no forecast data.', 'forecast_unavailable');
  }

  return data.forecasts.slice(0, days).map(mapDailyForecast);
}
