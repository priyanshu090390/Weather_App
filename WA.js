const API_KEY = "139ca6c2aae8ec2cc980456bb0689a10";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const errorMsg = document.getElementById("errorMsg");
const currentWeather = document.getElementById("currentWeather");
const forecastDiv = document.getElementById("forecast");
const recentCitiesDropdown = document.getElementById("recentCities");

let isCelsius = true;

/* ---------- Utility ---------- */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function clearError() {
  errorMsg.classList.add("hidden");
}

/* ---------- Recent Cities ---------- */
function saveCity(city) {
  let cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (!cities.includes(city)) {
    cities.unshift(city);
    cities = cities.slice(0, 5);
    localStorage.setItem("cities", JSON.stringify(cities));
  }
  loadCities();
}

function loadCities() {
  const cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (cities.length === 0) return;

  recentCitiesDropdown.innerHTML = `<option>Select Recent City</option>`;
  recentCitiesDropdown.classList.remove("hidden");

  cities.forEach(city => {
    const option = document.createElement("option");
    option.textContent = city;
    recentCitiesDropdown.appendChild(option);
  });
}

/* ---------- Fetch Weather ---------- */
async function fetchWeatherByCity(city) {
  try {
    clearError();

    const res = await fetch(
      `api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    if (!res.ok) {
      showError("City not found");
      return;
    }

    const data = await res.json();
    saveCity(city);
    displayCurrentWeather(data);
    fetchForecast(data.coord.lat, data.coord.lon);

  } catch {
    showError("Unable to fetch weather data");
  }
}

/* ---------- Location Weather ---------- */
locationBtn.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetchWeatherByLocation(latitude, longitude);
  });
});

async function fetchWeatherByLocation(lat, lon) {
  const res = await fetch(
    `api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
  const data = await res.json();
  displayCurrentWeather(data);
  fetchForecast(lat, lon);
}

/* ---------- Display Current Weather ---------- */
function displayCurrentWeather(data) {
  currentWeather.classList.remove("hidden");

  let temp = data.main.temp;
  let condition = data.weather[0].main;

  document.body.classList.toggle("rainy", condition === "Rain");

  currentWeather.innerHTML = `
    <h2 class="text-xl font-bold">${data.name}</h2>
    <p>🌡️ ${temp}°C</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>💨 Wind: ${data.wind.speed} m/s</p>
    <button id="toggleTemp" class="mt-2 bg-blue-500 px-3 py-1 rounded">
      Toggle °C / °F
    </button>
  `;

  if (temp > 40) {
    currentWeather.innerHTML += `<div class="hot-alert">🔥 Extreme Heat Alert!</div>`;
  }

  document.getElementById("toggleTemp").onclick = () => {
    isCelsius = !isCelsius;
    temp = isCelsius ? temp : (temp * 9) / 5 + 32;
    displayCurrentWeather({ ...data, main: { ...data.main, temp } });
  };
}

/* ---------- 5 Day Forecast ---------- */
async function fetchForecast(lat, lon) {
  const res = await fetch(
    `api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
  const data = await res.json();
  forecastDiv.innerHTML = "";

  data.list.filter((_, i) => i % 8 === 0).forEach(day => {
    forecastDiv.innerHTML += `
      <div class="bg-white text-black p-3 rounded">
        <p>${new Date(day.dt_txt).toDateString()}</p>
        <p>🌡️ ${day.main.temp}°C</p>
        <p>💧 ${day.main.humidity}%</p>
        <p>💨 ${day.wind.speed} m/s</p>
      </div>
    `;
  });
}

/* ---------- Events ---------- */
searchBtn.addEventListener("click", () => {
  if (cityInput.value === "") {
    showError("Please enter a city name");
    return;
  }
  fetchWeatherByCity(cityInput.value);
});

recentCitiesDropdown.addEventListener("change", e => {
  fetchWeatherByCity(e.target.value);
});

loadCities();
