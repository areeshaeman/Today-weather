const API_KEY = "9f934ad934fa5e19afbe5fbcf03352dd";

// DOM
const hero = document.getElementById("hero");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const headline = document.getElementById("headline");
const heroDesc = document.getElementById("heroDesc");
const miniStrip = document.getElementById("miniStrip");
const panelCity = document.getElementById("panelCity");
const panelTemp = document.getElementById("panelTemp");
const panelCond = document.getElementById("panelCond");
const panelWind = document.getElementById("panelWind");
const panelHumidity = document.getElementById("panelHumidity");
const panelFeels = document.getElementById("panelFeels");
const weekList = document.getElementById("weekList");
const toast = document.getElementById("toast");
const themeToggle = document.getElementById("toggleTheme");
const themeIcon = themeToggle.querySelector("i");

// ===== UNIT SYSTEM =====
let units = localStorage.getItem("units") || "metric";
const unitToggle = document.createElement("button");
unitToggle.id = "unitToggle";
unitToggle.textContent = units === "metric" ? "°C / m/s" : "°F / mph";
document.querySelector(".hero-top").appendChild(unitToggle);

// ===== THEME TOGGLE =====
const savedTheme = localStorage.getItem("theme") || "dark";
document.body.classList.add(savedTheme);
themeIcon.classList.toggle("fa-sun", savedTheme === "dark");
themeIcon.classList.toggle("fa-moon", savedTheme === "light");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  const isDark = document.body.classList.contains("dark");
  themeIcon.classList.toggle("fa-moon", !isDark);
  themeIcon.classList.toggle("fa-sun", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ===== TOAST FUNCTION =====
function showToast(msg, time = 2500) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), time);
}

// ===== FETCH HELPERS =====
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

// ===== WEATHER FETCH =====
async function loadWeatherByCoords(lat, lon, label = null) {
  try {
    const curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const cur = await fetchJSON(curUrl);
    const forUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const forecast = await fetchJSON(forUrl);
    renderMain(cur, forecast, label);
  } catch (err) {
    console.error(err);
    showToast("Error: " + err.message);
  }
}

// ===== SEARCH =====
async function searchCity(city) {
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      city
    )}&limit=1&appid=${API_KEY}`;
    const data = await fetchJSON(geoUrl);
    if (!data.length) throw new Error("City not found");
    const { lat, lon, name } = data[0];
    loadWeatherByCoords(lat, lon, name);
  } catch (err) {
    showToast("Search error: " + err.message);
  }
}

// ===== RENDER =====
function renderMain(current, forecast, label) {
  const cityName = label || current.name;
  const speedUnit = units === "metric" ? "m/s" : "mph";
  const tempUnit = units === "metric" ? "°C" : "°F";

  panelCity.textContent = `${cityName}, ${current.sys?.country || ""}`;
  panelTemp.textContent = `${Math.round(current.main.temp)}${tempUnit}`;
  panelCond.textContent = current.weather[0].description;
  panelWind.textContent = `${Math.round(current.wind.speed)} ${speedUnit}`;
  panelHumidity.textContent = `${current.main.humidity}%`;
  panelFeels.textContent = `${Math.round(current.main.feels_like)}${tempUnit}`;

  headline.textContent = `${current.weather[0].main} in ${cityName}`;
  heroDesc.textContent = `${current.weather[0].description}. Humidity ${
    current.main.humidity
  }% — Wind ${Math.round(current.wind.speed)} ${speedUnit}`;

  setHeroBackground(
    current.weather[0].main.toLowerCase(),
    current.weather[0].id
  );

  miniStrip.innerHTML = "";
  forecast.list.slice(0, 6).forEach((item) => {
    const dt = new Date(item.dt * 1000);
    const label = dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const el = document.createElement("li");
    el.innerHTML = `<div style="font-size:12px">${label}</div>
                    <div style="font-weight:700">${Math.round(
                      item.main.temp
                    )}${tempUnit}</div>
                    <img src="https://openweathermap.org/img/wn/${
                      item.weather[0].icon
                    }.png" alt="" />`;
    miniStrip.appendChild(el);
  });

  const days = {};
  forecast.list.forEach((item) => {
    const d = new Date(item.dt * 1000);
    const key = d.toLocaleDateString();
    if (!days[key]) days[key] = [];
    days[key].push(item);
  });
  weekList.innerHTML = "";
  Object.keys(days)
    .slice(0, 7)
    .forEach((dateKey) => {
      const arr = days[dateKey];
      const mid = arr[Math.floor(arr.length / 2)];
      const d = new Date(mid.dt * 1000);
      const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
      const card = document.createElement("div");
      card.className = "day-card";
      card.innerHTML = `<div style="font-weight:700">${dayName}</div>
                        <img src="https://openweathermap.org/img/wn/${
                          mid.weather[0].icon
                        }.png" alt="">
                        <div style="margin-top:6px;font-weight:600">${Math.round(
                          mid.main.temp
                        )}${tempUnit}</div>
                        <div style="opacity:0.85;font-size:13px">${
                          mid.weather[0].main
                        }</div>`;
      weekList.appendChild(card);
    });
}

// ===== BACKGROUND + ANIMATIONS =====
function setHeroBackground(main, id) {
  hero.className = "hero";
  if (main.includes("cloud")) hero.classList.add("bg-clouds");
  else if (main.includes("rain") || main.includes("drizzle")) {
    hero.classList.add("bg-rain", "rain-animation");
  } else if (main.includes("thunder") || (id >= 200 && id < 300)) {
    hero.classList.add("bg-thunder", "thunder-animation");
  } else if (main.includes("snow")) hero.classList.add("bg-snow");
  else hero.classList.add("bg-clear");
}

// ===== GEOLOCATION =====
function startWithGeolocation() {
  if (!navigator.geolocation) {
    showToast("Geolocation not supported");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) =>
      loadWeatherByCoords(
        pos.coords.latitude,
        pos.coords.longitude,
        "Your Location"
      ),
    () => showToast("Location blocked. Please search manually."),
    { timeout: 10000 }
  );
}

// ===== EVENT LISTENERS =====
searchBtn.addEventListener("click", () => {
  const v = searchInput.value.trim();
  if (!v) return showToast("Type a city name");
  searchCity(v);
});
searchInput.addEventListener(
  "keypress",
  (e) => e.key === "Enter" && searchBtn.click()
);
locBtn.addEventListener("click", startWithGeolocation);
unitToggle.addEventListener("click", () => {
  units = units === "metric" ? "imperial" : "metric";
  localStorage.setItem("units", units);
  unitToggle.textContent = units === "metric" ? "°C / m/s" : "°F / mph";
  showToast(`Switched to ${units === "metric" ? "Metric" : "Imperial"}`);
  startWithGeolocation();
});

// ===== LOGIN MODAL =====
const loginModal = document.createElement("div");
loginModal.className = "modal";
loginModal.innerHTML = `
  <div class="modal-content">
    <h3>Welcome Back!</h3>
    <input id="usernameInput" type="text" placeholder="Enter your name" />
    <button id="loginBtn">Login</button>
  </div>`;
document.body.appendChild(loginModal);

const username = localStorage.getItem("username");
if (!username) {
  loginModal.classList.add("active");
} else {
  document.querySelector(".name").textContent = username;
}

document.getElementById("loginBtn").addEventListener("click", () => {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return showToast("Enter your name");
  localStorage.setItem("username", name);
  document.querySelector(".name").textContent = name;
  loginModal.classList.remove("active");
  showToast(`Welcome, ${name}!`);
});

// ===== INIT =====
startWithGeolocation();
// === LOGOUT BUTTON ===
const logoutBtn = document.createElement("button");
logoutBtn.id = "logoutBtn";
logoutBtn.textContent = "Logout";
document.querySelector(".hero-top").appendChild(logoutBtn);

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("username");
  showToast("You have been logged out");
  loginModal.classList.add("active");
});
