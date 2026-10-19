import { apiGet } from "./api.js";
import { categoryIcon, categoryLabel } from "./icons.js";

const status = document.querySelector("#place-status");
const content = document.querySelector("#place-content");

function showStatus(message, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("status-error", isError);
}

function addDetail(container, label, value) {
  if (value === undefined || value === null || value === "") return;

  const row = document.createElement("div");
  row.className = "place-detail-row";

  const title = document.createElement("strong");
  title.textContent = label;

  const text = document.createElement("span");
  text.textContent = String(value);

  row.append(title, text);
  container.append(row);
}

function displayPlace(place) {
  content.replaceChildren();

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "12px";
  header.style.marginBottom = "16px";

  const icon = document.createElement("span");
  icon.className = "place-result-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = categoryIcon(place.category);

  const heading = document.createElement("h2");
  heading.textContent = place.name || "Unnamed place";

  header.append(icon, heading);
  content.append(header);

  addDetail(content, "Category", categoryLabel(place.category));
  addDetail(content, "Address", place.address);

  if (Number.isFinite(Number(place.distanceMeters))) {
    addDetail(
      content,
      "Distance",
      `${(Number(place.distanceMeters) / 1000).toFixed(1)} km`
    );
  }

  if (Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon))) {
    const actions = document.createElement("div");
    actions.className = "place-actions";

    const mapLink = document.createElement("a");
    const lat = encodeURIComponent(place.lat);
    const lon = encodeURIComponent(place.lon);

    mapLink.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
    mapLink.target = "_blank";
    mapLink.rel = "noopener noreferrer";
    mapLink.className = "button button-secondary";
    mapLink.textContent = "Open in map";

    actions.append(mapLink);
    content.append(actions);
  }

  showStatus("");
}

async function loadPlace() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    showStatus("Place ID was not provided.", true);
    return;
  }

  // Places visited from search results are cached in session storage.
  const savedPlace = sessionStorage.getItem(`nearhelp_place:${id}`);

  if (savedPlace) {
    try {
      displayPlace(JSON.parse(savedPlace));
      return;
    } catch {
      sessionStorage.removeItem(`nearhelp_place:${id}`);
    }
  }

  showStatus("Loading place details…");

  try {
    const query = new URLSearchParams({});
    if (params.get("lat")) query.set("lat", params.get("lat"));
    if (params.get("lon")) query.set("lon", params.get("lon"));

    const data = await apiGet(`/api/places/${encodeURIComponent(id)}?${query}`);

    if (!data.place) {
      showStatus("Place not found.", true);
      return;
    }

    displayPlace(data.place);
  } catch (error) {
    showStatus(error.message || "Could not load place details.", true);
  }
}

loadPlace();
