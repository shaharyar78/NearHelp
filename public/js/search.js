import { apiGet } from "./api.js";
import { showPlaces, showUserLocation } from "./map.js";
import { categoryIcon, categoryLabel } from "./icons.js";

const form = document.querySelector("#place-search-form");
const categorySelect = document.querySelector("#category");
const radiusSelect = document.querySelector("#radius");
const status = document.querySelector("#search-status");
const results = document.querySelector("#place-results");

function showStatus(message, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("status-error", isError);
}

function renderPlaces(places, userLat, userLon) {
  if (!results) return;

  results.replaceChildren();

  for (const place of places) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "place-result-card";

    const icon = document.createElement("span");
    icon.className = "place-result-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = categoryIcon(place.category);

    const body = document.createElement("span");
    body.style.minWidth = "0";

    const name = document.createElement("span");
    name.className = "place-result-name";
    name.textContent = place.name || "Unnamed place";

    const meta = document.createElement("span");
    meta.className = "place-result-meta";
    const metaParts = [categoryLabel(place.category)];
    if (place.address) metaParts.push(place.address);
    meta.textContent = metaParts.join(" · ");

    const distance = Number.isFinite(Number(place.distanceMeters))
      ? `${(Number(place.distanceMeters) / 1000).toFixed(1)} km`
      : "";

    body.append(name, meta);

    if (distance) {
      const badge = document.createElement("span");
      badge.className = "place-result-distance";
      badge.textContent = distance;
      body.append(badge);
    }

    link.append(icon, body);

    // Persist enough data to render the details page without another round trip.
    const savedPlace = {
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      lat: place.lat,
      lon: place.lon,
      distanceMeters: place.distanceMeters,
    };

    sessionStorage.setItem(
      `nearhelp_place:${place.id}`,
      JSON.stringify(savedPlace)
    );

    const params = new URLSearchParams({
      id: String(place.id),
      lat: String(userLat),
      lon: String(userLon),
    });

    link.href = `/place.html?${params}`;
    item.append(link);
    results.append(item);
  }
}

function preselectCategory(value) {
  if (!categorySelect || !value) return;
  const option = Array.from(categorySelect.options).find(
    (opt) => opt.value === value
  );
  if (option) categorySelect.value = value;
}

async function getCurrentLocation() {
  const nativeGeolocation = window.Capacitor?.Plugins?.Geolocation;

  if (nativeGeolocation) {
    let permissions = await nativeGeolocation.checkPermissions();
    if (permissions.location !== "granted" && permissions.coarseLocation !== "granted") {
      permissions = await nativeGeolocation.requestPermissions();
    }

    if (permissions.location !== "granted" && permissions.coarseLocation !== "granted") {
      const permissionError = new Error("Location permission was not granted.");
      permissionError.code = 1;
      throw permissionError;
    }

    return nativeGeolocation.getCurrentPosition({
      enableHighAccuracy: false,
      maximumAge: 30_000,
      timeout: 25_000,
    });
  }

  if (!navigator.geolocation) {
    throw new Error("Location is not supported by this browser.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 30_000,
      timeout: 25_000,
    });
  });
}

// Preselect a category from the URL (?category=hospital) on load.
preselectCategory(new URLSearchParams(window.location.search).get("category"));

// Landing-page category cards set the search filter before jumping to #nearby.
document.querySelectorAll("[data-category]").forEach((card) => {
  card.addEventListener("click", () => {
    preselectCategory(card.dataset.category);
  });
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  showStatus("Getting your location…");
  results?.replaceChildren();

  try {
    const { coords } = await getCurrentLocation();
    const { latitude, longitude } = coords;

    showUserLocation(latitude, longitude);
    showStatus("Searching nearby places…");

    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      radius: radiusSelect?.value || "5000",
    });

    if (categorySelect?.value) {
      params.set("category", categorySelect.value);
    }

    const data = await apiGet(`/api/places?${params}`);
    const places = Array.isArray(data.places) ? data.places : [];

    showPlaces(places);
    renderPlaces(places, latitude, longitude);

    showStatus(
      places.length
        ? `${places.length} place${places.length === 1 ? "" : "s"} found.`
        : "No places found in this area."
    );
  } catch (error) {
    const message = error?.code === 1 || /permission/i.test(error?.message || "")
      ? "Location permission is off. Allow NearHelp to access location in your phone settings, then try again."
      : error?.code === 2 || /location services|location is disabled/i.test(error?.message || "")
        ? "Your phone could not determine its location. Turn on Location and try again."
        : error?.code === 3 || /timeout/i.test(error?.message || "")
          ? "Location is taking too long. Turn on Location and try again."
          : error?.message || "Could not load nearby places.";
    showStatus(message, true);
  }
});
