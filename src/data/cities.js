// Reference data for the demo locations. Coordinates are fallbacks/display
// values only - live lookups still go through the Azure Maps Search API.
export const CITIES = [
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
  },
  {
    id: 'mumbai-in',
    city: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    coordinates: { latitude: 19.076, longitude: 72.8777 },
    timezone: 'Asia/Kolkata'
  },
  {
    id: 'manila-ph',
    city: 'Manila',
    country: 'Philippines',
    countryCode: 'PH',
    flag: '🇵🇭',
    coordinates: { latitude: 14.5995, longitude: 120.9842 },
    timezone: 'Asia/Manila'
  },
  {
    id: 'cebu-ph',
    city: 'Cebu',
    country: 'Philippines',
    countryCode: 'PH',
    flag: '🇵🇭',
    coordinates: { latitude: 10.3157, longitude: 123.8854 },
    timezone: 'Asia/Manila'
  }
];

const normalize = (value) => String(value ?? '').trim().toLowerCase();

export function findCity(city, country) {
  const wantedCity = normalize(city);
  const wantedCountry = normalize(country);

  return CITIES.find((entry) => {
    if (normalize(entry.city) !== wantedCity) return false;
    if (!wantedCountry) return true;
    return (
      normalize(entry.country) === wantedCountry ||
      normalize(entry.countryCode) === wantedCountry
    );
  });
}
