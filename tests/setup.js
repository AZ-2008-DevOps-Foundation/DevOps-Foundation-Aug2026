// Every test stubs fetch, so Azure Maps is never called for real. CI injects the
// AZURE_MAPS_KEY secret; locally fall back to a placeholder so config.js loads.
process.env.AZURE_MAPS_KEY ||= 'test-subscription-key';
process.env.AZURE_MAPS_BASE_URL ||= 'https://atlas.test';
process.env.AZURE_MAPS_TIMEOUT_MS ||= '2000';
