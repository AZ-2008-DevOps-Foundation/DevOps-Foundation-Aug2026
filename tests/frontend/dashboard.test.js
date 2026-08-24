import { afterEach, describe, expect, it, vi } from 'vitest';
import { citiesResponse, weatherApiResponse } from '../fixtures/azure-maps.js';
import { failedResponse, mountApp } from '../helpers/dom.js';

const SINGAPORE_WEATHER = {
  ...weatherApiResponse,
  city: 'Singapore',
  country: 'Singapore',
  countryCode: 'SG',
  weather: { ...weatherApiResponse.weather, temperatureC: 30.6, iconCode: 7, phrase: 'Cloudy' }
};

function weatherByCity(url) {
  const body = url.searchParams.get('city') === 'Singapore' ? SINGAPORE_WEATHER : weatherApiResponse;
  return { body };
}

const HAPPY_ROUTES = {
  '/api/cities': citiesResponse,
  '/api/weather': weatherByCity
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dashboard rendering', () => {
  it('groups cities by country and shows a flag image instead of a code', async () => {
    const { document } = await mountApp(HAPPY_ROUTES);

    const headings = await vi.waitFor(() => {
      const found = document.querySelectorAll('#country-groups h2');
      expect(found).toHaveLength(2);
      return found;
    });

    expect([...headings].map((heading) => heading.textContent.trim())).toEqual([
      'Australia',
      'Singapore'
    ]);

    const flag = headings[0].querySelector('img.country-flag');
    expect(flag.getAttribute('src')).toBe('https://flagcdn.com/au.svg');
    expect(flag.getAttribute('alt')).toBe('Australia flag');
  });

  it('binds the temperature and weather emoji returned by the API', async () => {
    const { document } = await mountApp(HAPPY_ROUTES);

    const cards = await vi.waitFor(() => {
      const found = document.querySelectorAll('#country-groups .city-card');
      expect(found).toHaveLength(2);
      expect(found[0].querySelector('.card-text').textContent).not.toBe('Loading…');
      return found;
    });

    expect(cards[0].querySelector('.card-title').textContent).toContain('Sydney');
    expect(cards[0].querySelector('.card-text').textContent).toBe('22°C');
    expect(cards[0].querySelector('.weather-emoji').textContent).toBe('☀️');
    expect(cards[0].querySelector('.weather-emoji').getAttribute('aria-label')).toBe('Sunny');

    expect(cards[1].querySelector('.card-text').textContent).toBe('31°C');
    expect(cards[1].querySelector('.weather-emoji').textContent).toBe('☁️');
  });

  it('renders a per-city flag on the card title', async () => {
    const { document } = await mountApp(HAPPY_ROUTES);

    const flag = await vi.waitFor(() => {
      const found = document.querySelector('#country-groups .city-card .card-title img');
      expect(found).not.toBeNull();
      return found;
    });

    expect(flag.getAttribute('src')).toBe('https://flagcdn.com/au.svg');
  });

  it('marks a city unavailable when its weather call fails', async () => {
    const { document } = await mountApp({
      '/api/cities': citiesResponse,
      '/api/weather': () => failedResponse('Azure Maps returned HTTP 502.', 502)
    });

    const card = await vi.waitFor(() => {
      const found = document.querySelector('#country-groups .city-card');
      expect(found?.querySelector('.card-text').textContent).toBe('Unavailable');
      return found;
    });

    expect(card.querySelector('.weather-emoji').textContent).toBe('⚠️');
  });

  it('shows an alert when the city list cannot be loaded', async () => {
    const { document } = await mountApp({
      '/api/cities': () => failedResponse('Service unavailable.', 503)
    });

    const alert = document.getElementById('dashboard-alert');
    await vi.waitFor(() => expect(alert.hidden).toBe(false));

    expect(alert.textContent).toContain('Could not load cities');
    expect(document.getElementById('loading').hidden).toBe(true);
  });
});

describe('city card navigation', () => {
  it('links each card to its detail route', async () => {
    const { document } = await mountApp(HAPPY_ROUTES);

    const cards = await vi.waitFor(() => {
      const found = document.querySelectorAll('#country-groups .city-card');
      expect(found).toHaveLength(2);
      return found;
    });

    expect(cards[0].getAttribute('href')).toBe('#/city/sydney-au');
    expect(cards[1].getAttribute('href')).toBe('#/city/singapore-sg');
  });

  it('opens the detail view when a card is clicked', async () => {
    const { document, window, leaflet } = await mountApp({
      ...HAPPY_ROUTES,
      '/api/forecast': { forecast: [] }
    });

    const card = await vi.waitFor(() => {
      const found = document.querySelector('#country-groups .city-card');
      expect(found).not.toBeNull();
      return found;
    });

    card.click();

    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#/city/sydney-au');
      expect(document.getElementById('detail-view').hidden).toBe(false);
      expect(document.getElementById('detail-temperature').textContent).toBe('22°C');
    });

    expect(document.getElementById('dashboard-view').hidden).toBe(true);
    expect(document.getElementById('detail-title').textContent).toContain('Sydney, Australia');
    expect(document.getElementById('detail-title').querySelector('img')).not.toBeNull();
    expect(leaflet.map).toHaveBeenCalledTimes(1);
    expect(leaflet.lastMap.setView).toHaveBeenCalledWith([-33.86785, 151.20732], 10);
  });

  it('returns to the dashboard from the back button', async () => {
    const { document, window } = await mountApp(
      { ...HAPPY_ROUTES, '/api/forecast': { forecast: [] } },
      { hash: '#/city/sydney-au' }
    );

    await vi.waitFor(() => expect(document.getElementById('detail-view').hidden).toBe(false));

    document.getElementById('back-button').click();

    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#/');
      expect(document.getElementById('dashboard-view').hidden).toBe(false);
    });
  });
});
