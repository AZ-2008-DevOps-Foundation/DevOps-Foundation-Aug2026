export const searchAddressResponse = {
  summary: { query: 'sydney, australia', numResults: 1 },
  results: [
    {
      type: 'Geography',
      position: { lat: -33.86785, lon: 151.20732 },
      address: { freeformAddress: 'Sydney, New South Wales' }
    }
  ]
};

export const currentConditionsResponse = {
  results: [
    {
      dateTime: '2026-08-24T10:00:00+10:00',
      phrase: 'Sunny',
      iconCode: 1,
      isDayTime: true,
      temperature: { value: 22.3, unit: 'C' },
      realFeelTemperature: { value: 24.1, unit: 'C' },
      dewPoint: { value: 11.2, unit: 'C' },
      relativeHumidity: 55,
      wind: {
        direction: { degrees: 90, localizedDescription: 'E' },
        speed: { value: 12.5, unit: 'km/h' }
      },
      windGust: { speed: { value: 25.9, unit: 'km/h' } },
      uvIndex: 6,
      uvIndexPhrase: 'High',
      cloudCover: 10,
      pressure: { value: 1015.2, unit: 'mb' },
      visibility: { value: 16.1, unit: 'km' },
      precipitationSummary: { pastHour: { value: 0.4, unit: 'mm' } },
      temperatureSummary: {
        past24Hour: { minimum: { value: 12.4 }, maximum: { value: 23.9 } }
      }
    }
  ]
};

export function dailyForecastResponse(entries = 10) {
  return {
    summary: { severity: 0 },
    forecasts: Array.from({ length: entries }, (_, index) => ({
      date: `2026-08-${String(24 + index).padStart(2, '0')}T07:00:00+10:00`,
      temperature: { minimum: { value: 11 + index }, maximum: { value: 20 + index } },
      realFeelTemperature: { minimum: { value: 10 + index }, maximum: { value: 22 + index } },
      hoursOfSun: 8.5,
      airAndPollen: [
        { name: 'AirQuality', value: 20, category: 'Good' },
        { name: 'UVIndex', value: 7, category: 'High' }
      ],
      day: {
        iconCode: 2,
        iconPhrase: 'Mostly sunny',
        longPhrase: 'Plenty of sunshine',
        precipitationProbability: 15,
        totalLiquid: { value: 1.2, unit: 'mm' },
        hoursOfPrecipitation: 0.5,
        wind: {
          direction: { degrees: 180, localizedDescription: 'S' },
          speed: { value: 14.8, unit: 'km/h' }
        },
        windGust: { speed: { value: 30.4, unit: 'km/h' } },
        cloudCover: 25
      }
    }))
  };
}

export const citiesResponse = {
  cities: [
    {
      id: 'sydney-au',
      city: 'Sydney',
      country: 'Australia',
      countryCode: 'AU',
      flag: '🇦🇺',
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timezone: 'Australia/Sydney'
    },
    {
      id: 'singapore-sg',
      city: 'Singapore',
      country: 'Singapore',
      countryCode: 'SG',
      flag: '🇸🇬',
      coordinates: { latitude: 1.3521, longitude: 103.8198 },
      timezone: 'Asia/Singapore'
    }
  ]
};

export const weatherApiResponse = {
  city: 'Sydney',
  country: 'Australia',
  countryCode: 'AU',
  flag: '🇦🇺',
  timezone: 'Australia/Sydney',
  coordinates: { latitude: -33.86785, longitude: 151.20732 },
  resolvedAddress: 'Sydney, New South Wales',
  weather: {
    observedAt: '2026-08-24T10:00:00+10:00',
    phrase: 'Sunny',
    iconCode: 1,
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
  },
  retrievedAt: '2026-08-24T00:00:00.000Z'
};

export const forecastApiResponse = {
  city: 'Sydney',
  country: 'Australia',
  countryCode: 'AU',
  timezone: 'Australia/Sydney',
  coordinates: { latitude: -33.86785, longitude: 151.20732 },
  days: 5,
  forecast: Array.from({ length: 5 }, (_, index) => ({
    date: `2026-08-${String(24 + index).padStart(2, '0')}T07:00:00+10:00`,
    minTemperatureC: 11 + index,
    maxTemperatureC: 20 + index,
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
  })),
  retrievedAt: '2026-08-24T00:00:00.000Z'
};
