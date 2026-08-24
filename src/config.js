import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required configuration "${name}". Copy .env.example to .env and set a value.`
    );
  }
  return value.trim();
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  azureMaps: {
    key: required('AZURE_MAPS_KEY'),
    baseUrl: (process.env.AZURE_MAPS_BASE_URL || 'https://atlas.microsoft.com').replace(/\/$/, ''),
    timeoutMs: Number(process.env.AZURE_MAPS_TIMEOUT_MS) || 8000
  }
};
