const mapElement = document.querySelector("#map");

let map = null;
let markers = null;
let userMarker = null;

function makePinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" aria-hidden="true"><path d="M16 2C8.27 2 2 8.27 2 16c0 11 14 24 14 24s14-13 14-24C30 8.27 23.73 2 16 2Z" fill="${color}" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="16" r="5.5" fill="#ffffff"/></svg>`;

  return L.divIcon({
    className: "nh-marker",
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
  });
}

const placeIcon = makePinIcon("#0f8573");
const userIcon = makePinIcon("#2563eb");

if (mapElement && window.L) {
  map = L.map(mapElement, { scrollWheelZoom: false }).setView([20.5937, 78.9629], 5);
  markers = L.featureGroup().addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
}

export function showUserLocation(lat, lon) {
  if (!map || !markers) return;

  const position = [Number(lat), Number(lon)];

  if (userMarker) {
    markers.removeLayer(userMarker);
  }

  userMarker = L.marker(position, { icon: userIcon }).bindPopup("Your location");
  userMarker.addTo(markers);

  map.setView(position, 14);
}

export function showPlaces(places) {
  if (!map || !markers) return;

  markers.clearLayers();
  userMarker = null;

  for (const place of places) {
    const lat = Number(place.lat);
    const lon = Number(place.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    L.marker([lat, lon], { icon: placeIcon })
      .addTo(markers)
      .bindPopup(place.name || "Place");
  }

  if (markers.getLayers().length > 0) {
    map.fitBounds(markers.getBounds().pad(0.15));
  }
}
