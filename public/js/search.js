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

  if (!navigator.geolocation) {
    showStatus("Location is not supported by this browser.", true);
    return;
  }

  showStatus("Getting your location…");
  results?.replaceChildren();

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
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

      try {
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
        showStatus(error.message || "Could not load nearby places.", true);
      }
    },
    () => {
      showStatus(
        "Could not get your location. Check your browser permissions.",
        true
      );
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});
