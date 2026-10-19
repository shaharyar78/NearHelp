import { apiPost, clearToken, clearUser } from "./api.js";

const form = document.querySelector("#add-place-form");
const status = document.querySelector("#add-place-status");
const locationButton = document.querySelector("#get-location-button");
const submitButton = form?.querySelector('button[type="submit"]');

function showStatus(message, isError = false) {
  if (!status) return;

  status.textContent = message;
  status.classList.toggle("status-error", isError);
}

if (!localStorage.getItem("nearhelp_token")) {
  window.location.href = "/login.html";
}

document.querySelector("#logout-button")?.addEventListener("click", () => {
  clearToken();
  clearUser();
  window.location.href = "/login.html";
});

locationButton?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showStatus("Location is not supported by this browser.", true);
    return;
  }

    showStatus("Getting your location…");
  locationButton.disabled = true;

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      document.querySelector("#place-lat").value = coords.latitude;
      document.querySelector("#place-lon").value = coords.longitude;

      showStatus("Location found. Review the address before submitting.");
      locationButton.disabled = false;
    },
    () => {
      showStatus(
        "Could not get your location. Check your browser permissions.",
        true
      );
      locationButton.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    lat: Number(formData.get("lat")),
    lon: Number(formData.get("lon")),
  };

  showStatus("Submitting place…");
  if (submitButton) submitButton.disabled = true;

  try {
    const data = await apiPost("/api/places/community", payload);
    showStatus(data.message || "Place submitted for review.");
    form.reset();
  } catch (error) {
    showStatus(error.message || "Could not submit the place.", true);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});
