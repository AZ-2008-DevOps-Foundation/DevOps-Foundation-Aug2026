import { vi } from 'vitest';

export function jsonResponse(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  };
}

/**
 * Stubs global fetch and routes each Azure Maps call by URL pathname.
 * Any unmapped path fails the test instead of hitting the network.
 */
export function stubAzureMaps(routes) {
  const mock = vi.fn(async (input) => {
    const url = new URL(input);
    const handler = routes[url.pathname];

    if (!handler) {
      throw new Error(`Unexpected Azure Maps request: ${url.pathname}`);
    }
    return typeof handler === 'function' ? handler(url) : jsonResponse(handler);
  });

  vi.stubGlobal('fetch', mock);
  return mock;
}

export const AZURE_MAPS_PATHS = {
  search: '/search/address/json',
  currentConditions: '/weather/currentConditions/json',
  dailyForecast: '/weather/forecast/daily/json'
};
