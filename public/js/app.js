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
  detailMetrics: document.getElementById('detail-metrics'),
  detailMap: document.getElementById('detail-map'),
  forecastAlert: document.getElementById('forecast-alert'),
  forecastList: document.getElementById('forecast-list'),
  forecastRanges: document.querySelectorAll('input[name="forecast-range"]'),
  backButton: document.getElementById('back-button'),
  loading: document.getElementById('loading')
};

let citiesPromise = null;
let map = null;
let marker = null;
let activeCity = null;

function weatherEmoji(iconCode) {
  return WEATHER_EMOJI[iconCode] ?? '🌡️';
}

function formatTemperature(value) {
  return typeof value === 'number' ? `${Math.round(value)}°C` : '—';
}

function formatNumber(value, unit, digits = 0) {
  return typeof value === 'number' ? `${value.toFixed(digits)} ${unit}` : '—';
}

function formatPercent(value) {
  return typeof value === 'number' ? `${Math.round(value)}%` : '—';
}

function formatDay(isoDate, timezone) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return { weekday: '—', date: '' };

  const options = timezone ? { timeZone: timezone } : {};
  return {
    weekday: date.toLocaleDateString(undefined, { ...options, weekday: 'short' }),
    date: date.toLocaleDateString(undefined, { ...options, day: 'numeric', month: 'short' })
  };
}

// Emoji flags degrade to two-letter acronyms on Windows, so render real images.
function createFlagImage(countryCode, country, className = 'country-flag') {
  const img = document.createElement('img');
  img.className = className;
  img.src = `https://flagcdn.com/${String(countryCode).toLowerCase()}.svg`;
  img.alt = `${country} flag`;
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
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

function loadForecast(city, days) {
  const query = new URLSearchParams({
    city: city.city,
    country: city.countryCode,
    days: String(days)
  });
  return requestJson(`/api/forecast?${query.toString()}`);
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
      groups.set(city.country, {
        country: city.country,
        countryCode: city.countryCode,
        cities: []
      });
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
  name.className = 'h5 card-title mb-1 d-flex align-items-center gap-2';
  name.append(
    createFlagImage(city.countryCode, city.country, 'country-flag country-flag-sm'),
    document.createTextNode(city.city)
  );
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

  const countryName = document.createElement('span');
  countryName.textContent = group.country;

  heading.append(createFlagImage(group.countryCode, group.country), countryName);

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

function createMetricCard(label, value) {
  const column = document.createElement('div');
  column.className = 'col';

  const box = document.createElement('div');
  box.className = 'metric-card h-100 p-3 rounded-3 bg-body-tertiary';

  const term = document.createElement('div');
  term.className = 'text-body-secondary small';
  term.textContent = label;

  const data = document.createElement('div');
  data.className = 'fs-5';
  data.textContent = value;

  box.append(term, data);
  column.append(box);
  return column;
}

function renderCurrentMetrics(weather) {
  const uv =
    typeof weather.uvIndex === 'number'
      ? `${weather.uvIndex}${weather.uvIndexPhrase ? ` (${weather.uvIndexPhrase})` : ''}`
      : '—';
  const wind =
    typeof weather.windSpeedKmh === 'number'
      ? `${Math.round(weather.windSpeedKmh)} km/h${
          weather.windDirection ? ` ${weather.windDirection}` : ''
        }`
      : '—';

  const metrics = [
    ['Feels like', formatTemperature(weather.feelsLikeC)],
    ['Min (24h)', formatTemperature(weather.minTemperatureC)],
    ['Max (24h)', formatTemperature(weather.maxTemperatureC)],
    ['Humidity', formatPercent(weather.humidityPercent)],
    ['UV index', uv],
    ['Wind', wind],
    ['Wind gust', formatNumber(weather.windGustKmh, 'km/h')],
    ['Dew point', formatTemperature(weather.dewPointC)],
    ['Cloud cover', formatPercent(weather.cloudCoverPercent)],
    ['Pressure', formatNumber(weather.pressureMb, 'mb')],
    ['Visibility', formatNumber(weather.visibilityKm, 'km', 1)],
    ['Rain (past hour)', formatNumber(weather.precipitationPastHourMm, 'mm', 1)]
  ];

  elements.detailMetrics.replaceChildren(
    ...metrics.map(([label, value]) => createMetricCard(label, value))
  );
}

function createForecastCard(entry, timezone) {
  const column = document.createElement('div');
  column.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';

  const card = document.createElement('div');
  card.className = 'forecast-card h-100 p-3 rounded-3 border bg-body';

  const { weekday, date } = formatDay(entry.date, timezone);

  const header = document.createElement('div');
  header.className = 'd-flex justify-content-between align-items-start';

  const dayLabel = document.createElement('div');
  const dayName = document.createElement('div');
  dayName.className = 'fw-semibold';
  dayName.textContent = weekday;
  const dayDate = document.createElement('div');
  dayDate.className = 'text-body-secondary small';
  dayDate.textContent = date;
  dayLabel.append(dayName, dayDate);

  const icon = document.createElement('span');
  icon.className = 'forecast-emoji';
  icon.setAttribute('role', 'img');
  icon.setAttribute('aria-label', entry.phrase ?? 'Forecast');
  icon.textContent = weatherEmoji(entry.iconCode);

  header.append(dayLabel, icon);

  const temperatures = document.createElement('div');
  temperatures.className = 'fs-5 mt-2';
  temperatures.textContent = `${formatTemperature(entry.maxTemperatureC)} / ${formatTemperature(
    entry.minTemperatureC
  )}`;

  const phrase = document.createElement('div');
  phrase.className = 'text-body-secondary small mb-2';
  phrase.textContent = entry.phrase ?? '';

  const list = document.createElement('dl');
  list.className = 'forecast-details row row-cols-2 g-1 small mb-0';

  const details = [
    ['UV index', typeof entry.uvIndex === 'number' ? String(entry.uvIndex) : '—'],
    ['Wind', formatNumber(entry.windSpeedKmh, 'km/h')],
    ['Rain chance', formatPercent(entry.precipitationProbability)],
    ['Rainfall', formatNumber(entry.precipitationMm, 'mm', 1)],
    ['Cloud cover', formatPercent(entry.cloudCoverPercent)],
    ['Sun hours', formatNumber(entry.hoursOfSun, 'h', 1)]
  ];

  for (const [label, value] of details) {
    const term = document.createElement('dt');
    term.className = 'col text-body-secondary fw-normal';
    term.textContent = label;
    const data = document.createElement('dd');
    data.className = 'col mb-0 text-end';
    data.textContent = value;
    list.append(term, data);
  }

  card.append(header, temperatures, phrase, list);
  column.append(card);
  return column;
}

function selectedForecastDays() {
  const checked = [...elements.forecastRanges].find((input) => input.checked);
  return Number(checked?.value) || 5;
}

async function renderForecast(city, days) {
  hideAlert(elements.forecastAlert);

  const placeholder = document.createElement('div');
  placeholder.className = 'col-12 text-body-secondary';
  placeholder.textContent = `Loading ${days}-day forecast…`;
  elements.forecastList.replaceChildren(placeholder);

  try {
    const data = await loadForecast(city, days);
    if (activeCity?.id !== city.id) return;

    elements.forecastList.replaceChildren(
      ...data.forecast.map((entry) => createForecastCard(entry, city.timezone))
    );
  } catch (error) {
    if (activeCity?.id !== city.id) return;
    elements.forecastList.replaceChildren();
    showAlert(elements.forecastAlert, `Could not load the forecast: ${error.message}`);
  }
}

async function renderDetail(cityId) {
  showView('detail');
  hideAlert(elements.detailAlert);
  hideAlert(elements.forecastAlert);
  setLoading(true);

  try {
    const cities = await loadCities();
    const city = cities.find((entry) => entry.id === cityId);
    if (!city) {
      throw new Error(`Unknown city "${cityId}".`);
    }

    activeCity = city;

    elements.detailTitle.replaceChildren(
      createFlagImage(city.countryCode, city.country),
      document.createTextNode(`${city.city}, ${city.country}`)
    );
    elements.detailSubtitle.textContent = 'Loading current conditions…';
    elements.detailEmoji.textContent = '';
    elements.detailTemperature.textContent = '';
    elements.detailCondition.textContent = '';
    elements.detailMetrics.replaceChildren();

    renderForecast(city, selectedForecastDays());

    const data = await loadWeather(city);
    const weather = data.weather ?? {};

    elements.detailSubtitle.textContent = data.resolvedAddress ?? `${city.city}, ${city.country}`;
    elements.detailEmoji.textContent = weatherEmoji(weather.iconCode);
    elements.detailTemperature.textContent = formatTemperature(weather.temperatureC);
    elements.detailCondition.textContent = weather.phrase ?? 'No description available';
    renderCurrentMetrics(weather);

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
  activeCity = null;
  renderDashboard();
}

for (const input of elements.forecastRanges) {
  input.addEventListener('change', () => {
    if (activeCity) {
      renderForecast(activeCity, selectedForecastDays());
    }
  });
}

elements.backButton.addEventListener('click', () => {
  window.location.hash = '#/';
});

window.addEventListener('hashchange', route);
route();
