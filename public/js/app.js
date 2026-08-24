const WEATHER_EMOJI = {
  1: '☀️', 2: '🌤️', 3: '⛅', 4: '⛅', 5: '🌤️', 6: '🌥️', 7: '☁️', 8: '☁️',
  11: '🌫️', 12: '🌦️', 13: '🌦️', 14: '🌦️', 15: '⛈️', 16: '⛈️', 17: '⛈️',
  18: '🌧️', 19: '🌨️', 20: '🌨️', 21: '🌨️', 22: '❄️', 23: '❄️', 24: '🧊',
  25: '🌨️', 26: '🌧️', 29: '🌨️', 30: '🥵', 31: '🥶', 32: '💨',
  33: '🌙', 34: '🌙', 35: '☁️', 36: '☁️', 37: '🌫️', 38: '☁️',
  39: '🌦️', 40: '🌧️', 41: '⛈️', 42: '⛈️', 43: '🌨️', 44: '❄️'
};

const elements = {
  dashboard: document.getElementById('dashboard-view'),
  dashboardAlert: document.getElementById('dashboard-alert'),
  countryGroups: document.getElementById('country-groups'),
  detail: document.getElementById('detail-view'),
  detailAlert: document.getElementById('detail-alert'),
  detailTitle: document.getElementById('detail-title'),
  detailSubtitle: document.getElementById('detail-subtitle'),
  detailEmoji: document.getElementById('detail-emoji'),
  detailTemperature: document.getElementById('detail-temperature'),
  detailCondition: document.getElementById('detail-condition'),
  detailMin: document.getElementById('detail-min'),
  detailMax: document.getElementById('detail-max'),
  detailFeelsLike: document.getElementById('detail-feels-like'),
  detailHumidity: document.getElementById('detail-humidity'),
  detailMap: document.getElementById('detail-map'),
  backButton: document.getElementById('back-button'),
  loading: document.getElementById('loading')
};

let citiesPromise = null;
let map = null;
let marker = null;

function weatherEmoji(iconCode) {
  return WEATHER_EMOJI[iconCode] ?? '🌡️';
}

function formatTemperature(value) {
  return typeof value === 'number' ? `${Math.round(value)}°C` : '—';
}

async function requestJson(url) {
  const response = await fetch(url);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Request failed with HTTP ${response.status}.`);
  }
  return payload;
}

function loadCities() {
  if (!citiesPromise) {
    citiesPromise = requestJson('/api/cities')
      .then((payload) => payload.cities ?? [])
      .catch((error) => {
        citiesPromise = null;
        throw error;
      });
  }
  return citiesPromise;
}

function loadWeather(city) {
  const query = new URLSearchParams({ city: city.city, country: city.countryCode });
  return requestJson(`/api/weather?${query.toString()}`);
}

function showAlert(element, message) {
  element.textContent = message;
  element.hidden = false;
}

function hideAlert(element) {
  element.textContent = '';
  element.hidden = true;
}

function groupByCountry(cities) {
  const groups = new Map();
  for (const city of cities) {
    if (!groups.has(city.country)) {
      groups.set(city.country, { country: city.country, flag: city.flag, cities: [] });
    }
    groups.get(city.country).cities.push(city);
  }
  return [...groups.values()];
}

function createCityCard(city) {
  const column = document.createElement('div');
  column.className = 'col-12 col-sm-6 col-lg-4';

  const card = document.createElement('a');
  card.className = 'city-card card h-100 shadow-sm text-decoration-none text-body';
  card.href = `#/city/${encodeURIComponent(city.id)}`;

  const body = document.createElement('div');
  body.className = 'card-body d-flex justify-content-between align-items-center gap-3';

  const info = document.createElement('div');
  const name = document.createElement('h3');
  name.className = 'h5 card-title mb-1';
  name.textContent = city.city;
  const temperature = document.createElement('p');
  temperature.className = 'card-text fs-4 mb-0';
  temperature.textContent = 'Loading…';
  info.append(name, temperature);

  const emoji = document.createElement('span');
  emoji.className = 'weather-emoji';

  body.append(info, emoji);
  card.append(body);
  column.append(card);

  loadWeather(city)
    .then((data) => {
      temperature.textContent = formatTemperature(data.weather?.temperatureC);
      emoji.textContent = weatherEmoji(data.weather?.iconCode);
      emoji.setAttribute('role', 'img');
      emoji.setAttribute('aria-label', data.weather?.phrase ?? 'Current weather');
    })
    .catch(() => {
      temperature.textContent = 'Unavailable';
      emoji.textContent = '⚠️';
    });

  return column;
}

function renderCountryGroup(group) {
  const section = document.createElement('section');

  const heading = document.createElement('h2');
  heading.className = 'h5 d-flex align-items-center gap-2 mb-3';

  const flag = document.createElement('span');
  flag.className = 'country-flag';
  flag.setAttribute('role', 'img');
  flag.setAttribute('aria-label', group.country);
  flag.textContent = group.flag;

  const countryName = document.createElement('span');
  countryName.textContent = group.country;

  heading.append(flag, countryName);

  const row = document.createElement('div');
  row.className = 'row g-3';
  for (const city of group.cities) {
    row.append(createCityCard(city));
  }

  section.append(heading, row);
  return section;
}

function setLoading(isLoading) {
  elements.loading.hidden = !isLoading;
}

function showView(name) {
  elements.dashboard.hidden = name !== 'dashboard';
  elements.detail.hidden = name !== 'detail';
}

async function renderDashboard() {
  showView('dashboard');
  hideAlert(elements.dashboardAlert);
  elements.countryGroups.replaceChildren();
  setLoading(true);

  try {
    const cities = await loadCities();
    const groups = groupByCountry(cities).map(renderCountryGroup);
    elements.countryGroups.replaceChildren(...groups);
  } catch (error) {
    showAlert(elements.dashboardAlert, `Could not load cities: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

function renderMap({ latitude, longitude }, label) {
  if (!map) {
    map = L.map(elements.detailMap);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  }

  map.setView([latitude, longitude], 10);
  if (marker) {
    marker.remove();
  }
  marker = L.marker([latitude, longitude]).addTo(map).bindPopup(label);
  map.invalidateSize();
}

async function renderDetail(cityId) {
  showView('detail');
  hideAlert(elements.detailAlert);
  setLoading(true);

  try {
    const cities = await loadCities();
    const city = cities.find((entry) => entry.id === cityId);
    if (!city) {
      throw new Error(`Unknown city "${cityId}".`);
    }

    elements.detailTitle.textContent = `${city.flag} ${city.city}, ${city.country}`;
    elements.detailSubtitle.textContent = 'Loading current conditions…';
    elements.detailEmoji.textContent = '';
    elements.detailTemperature.textContent = '';
    elements.detailCondition.textContent = '';

    const data = await loadWeather(city);
    const weather = data.weather ?? {};

    elements.detailSubtitle.textContent = data.resolvedAddress ?? `${city.city}, ${city.country}`;
    elements.detailEmoji.textContent = weatherEmoji(weather.iconCode);
    elements.detailTemperature.textContent = formatTemperature(weather.temperatureC);
    elements.detailCondition.textContent = weather.phrase ?? 'No description available';
    elements.detailMin.textContent = formatTemperature(weather.minTemperatureC);
    elements.detailMax.textContent = formatTemperature(weather.maxTemperatureC);
    elements.detailFeelsLike.textContent = formatTemperature(weather.feelsLikeC);
    elements.detailHumidity.textContent =
      typeof weather.humidityPercent === 'number' ? `${weather.humidityPercent}%` : '—';

    renderMap(data.coordinates ?? city.coordinates, `${city.city}, ${city.country}`);
  } catch (error) {
    showAlert(elements.detailAlert, `Could not load city details: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

function route() {
  const match = /^#\/city\/(.+)$/.exec(window.location.hash);
  if (match) {
    renderDetail(decodeURIComponent(match[1]));
    return;
  }
  renderDashboard();
}

elements.backButton.addEventListener('click', () => {
  window.location.hash = '#/';
});

window.addEventListener('hashchange', route);
route();
