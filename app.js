const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const form = document.querySelector("#search-form");
const input = document.querySelector("#city-input");
const searchButton = form.querySelector("button");
const card = document.querySelector("#weather-card");
const emptyState = document.querySelector("#empty-state");
const weatherContent = document.querySelector("#weather-content");
const statusMessage = document.querySelector("#status-message");

const weatherCodes = {
  0: { description: "Despejado", icon: "☀️", nightIcon: "🌙" },
  1: { description: "Mayormente despejado", icon: "🌤️", nightIcon: "🌙" },
  2: { description: "Parcialmente nublado", icon: "⛅", nightIcon: "☁️" },
  3: { description: "Nublado", icon: "☁️", nightIcon: "☁️" },
  45: { description: "Niebla", icon: "🌫️", nightIcon: "🌫️" },
  48: { description: "Niebla con escarcha", icon: "🌫️", nightIcon: "🌫️" },
  51: { description: "Llovizna ligera", icon: "🌦️", nightIcon: "🌧️" },
  53: { description: "Llovizna moderada", icon: "🌦️", nightIcon: "🌧️" },
  55: { description: "Llovizna intensa", icon: "🌧️", nightIcon: "🌧️" },
  56: { description: "Llovizna helada ligera", icon: "🌧️", nightIcon: "🌧️" },
  57: { description: "Llovizna helada intensa", icon: "🌧️", nightIcon: "🌧️" },
  61: { description: "Lluvia ligera", icon: "🌦️", nightIcon: "🌧️" },
  63: { description: "Lluvia moderada", icon: "🌧️", nightIcon: "🌧️" },
  65: { description: "Lluvia intensa", icon: "🌧️", nightIcon: "🌧️" },
  66: { description: "Lluvia helada ligera", icon: "🌧️", nightIcon: "🌧️" },
  67: { description: "Lluvia helada intensa", icon: "🌧️", nightIcon: "🌧️" },
  71: { description: "Nevada ligera", icon: "🌨️", nightIcon: "🌨️" },
  73: { description: "Nevada moderada", icon: "🌨️", nightIcon: "🌨️" },
  75: { description: "Nevada intensa", icon: "❄️", nightIcon: "❄️" },
  77: { description: "Granizo pequeño", icon: "🌨️", nightIcon: "🌨️" },
  80: { description: "Chubascos ligeros", icon: "🌦️", nightIcon: "🌧️" },
  81: { description: "Chubascos moderados", icon: "🌧️", nightIcon: "🌧️" },
  82: { description: "Chubascos intensos", icon: "⛈️", nightIcon: "⛈️" },
  85: { description: "Chubascos de nieve ligeros", icon: "🌨️", nightIcon: "🌨️" },
  86: { description: "Chubascos de nieve intensos", icon: "❄️", nightIcon: "❄️" },
  95: { description: "Tormenta", icon: "⛈️", nightIcon: "⛈️" },
  96: { description: "Tormenta con granizo ligero", icon: "⛈️", nightIcon: "⛈️" },
  99: { description: "Tormenta con granizo intenso", icon: "⛈️", nightIcon: "⛈️" },
};

let activeRequest = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = input.value.trim();

  if (!city) {
    input.focus();
    return;
  }

  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  setLoading(true);
  setError("");

  try {
    const location = await findCity(city, request.signal);
    const weather = await getWeather(location, request.signal);
    renderWeather(location, weather);
  } catch (error) {
    if (error.name === "AbortError") return;
    setError(error.message);
  } finally {
    if (activeRequest === request) {
      setLoading(false);
    }
  }
});

async function findCity(city, signal) {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name: city,
    count: "1",
    language: "es",
    format: "json",
  });

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("No se pudo buscar la ciudad. Inténtalo de nuevo.");
  }

  const data = await response.json();
  const location = data.results?.[0];
  if (!location) {
    throw new Error(`No encontramos “${city}”. Prueba con otro nombre.`);
  }
  return location;
}

async function getWeather(location, signal) {
  const url = new URL(WEATHER_URL);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
    timezone: "auto",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
  });

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("No se pudo cargar el clima. Inténtalo de nuevo.");
  }

  const data = await response.json();
  if (!data.current) {
    throw new Error("No hay datos del clima disponibles para esta ciudad.");
  }
  return data.current;
}

function renderWeather(location, weather) {
  const condition = weatherCodes[weather.weather_code] ?? {
    description: "Estado del cielo no disponible",
    icon: "🌡️",
    nightIcon: "🌡️",
  };
  const isDay = weather.is_day === 1;
  const displayName = [location.name, location.admin1, location.country]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(", ");
  const localDate = weather.time
    ? new Date(weather.time).toLocaleDateString("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  document.querySelector("#location-name").textContent = displayName;
  document.querySelector("#weather-date").textContent = localDate;
  document.querySelector("#weather-symbol").textContent = isDay
    ? condition.icon
    : condition.nightIcon;
  document.querySelector("#temperature").textContent = Math.round(
    weather.temperature_2m,
  );
  document.querySelector("#weather-description").textContent =
    condition.description;
  document.querySelector("#feels-like").textContent = Math.round(
    weather.apparent_temperature,
  );
  document.querySelector("#humidity").textContent =
    weather.relative_humidity_2m;
  document.querySelector("#wind-speed").textContent = Math.round(
    weather.wind_speed_10m,
  );
  document.querySelector("#daylight").textContent = isDay
    ? "De día"
    : "De noche";

  emptyState.hidden = true;
  weatherContent.hidden = false;
  card.classList.remove("is-empty");
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.querySelector("span").textContent = isLoading
    ? "Buscando..."
    : "Buscar";
  card.classList.toggle("is-loading", isLoading);
  card.setAttribute("aria-busy", String(isLoading));
}

function setError(message) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-visible", Boolean(message));
}
