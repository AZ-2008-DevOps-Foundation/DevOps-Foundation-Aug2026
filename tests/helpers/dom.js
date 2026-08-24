import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { vi } from 'vitest';

const INDEX_HTML = readFileSync(
  fileURLToPath(new URL('../../public/index.html', import.meta.url)),
  'utf8'
);

export function createLeafletStub() {
  const map = { setView: vi.fn(), invalidateSize: vi.fn() };
  const marker = { addTo: vi.fn(), bindPopup: vi.fn(), remove: vi.fn() };
  marker.addTo.mockReturnValue(marker);
  marker.bindPopup.mockReturnValue(marker);

  return {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    marker: vi.fn(() => marker),
    lastMap: map,
    lastMarker: marker
  };
}

function createApiStub(routes) {
  return vi.fn(async (input) => {
    const url = new URL(input, 'http://localhost');
    const handler = routes[url.pathname];

    if (!handler) {
      throw new Error(`Unexpected request: ${url.pathname}`);
    }

    const result = typeof handler === 'function' ? await handler(url) : { body: handler };
    const { body, status = 200 } = result;

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body
    };
  });
}

export function failedResponse(message, status = 500) {
  return { status, body: { error: { code: 'test_error', message } } };
}

/**
 * Loads public/index.html into a fresh JSDOM, stubs Leaflet and fetch, then
 * imports the frontend bundle so it renders against that DOM.
 */
export async function mountApp(routes = {}, { hash = '' } = {}) {
  const dom = new JSDOM(INDEX_HTML, { url: `http://localhost/${hash}` });
  const leaflet = createLeafletStub();
  const fetchMock = createApiStub(routes);

  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('L', leaflet);
  vi.stubGlobal('fetch', fetchMock);

  // app.js renders on import, so drop the cached instance to re-run it.
  vi.resetModules();
  await import('../../public/js/app.js');

  return { dom, window: dom.window, document: dom.window.document, fetchMock, leaflet };
}
