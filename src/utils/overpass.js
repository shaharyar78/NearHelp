const GEOAPIFY_URL = "https://api.geoapify.com/v2/places";

const CATEGORY_MAP = {
  hospital: ["healthcare.hospital", "healthcare.clinic_or_praxis"],
  pharmacy: ["healthcare.pharmacy"],
  police: ["service.police"],
  fire_station: ["service.fire_station"],
  shelter: ["service.social_facility.shelter"],
  food: ["catering"],
  shop: ["commercial"],
  school: ["education.school"],
  college: ["education.college", "education.university"],
  library: ["education.library"],
  bank: ["service.financial.bank"],
  atm: ["service.financial.atm"],
  parking: ["parking"],
  bus_station: ["public_transport.bus"],
  train_station: ["public_transport.train"],
};

// Category blank ho to in sab categories ko search karega.
const ALL_CATEGORIES = [
  "healthcare",
  "service.police",
  "service.fire_station",
  "service.social_facility.shelter",
  "catering",
  "commercial",
  "education",
  "service.financial",
  "parking",
];

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6_371_000;

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  );
}

function normalizeArguments(latOrOptions, lon, radius, category) {
  if (latOrOptions && typeof latOrOptions === "object") {
    return {
      lat: Number(latOrOptions.lat),
      lon: Number(latOrOptions.lon),
      radius: Number(latOrOptions.radius ?? 5000),
      category: latOrOptions.category ?? "",
    };
  }

  return {
    lat: Number(latOrOptions),
    lon: Number(lon),
    radius: Number(radius ?? 5000),
    category: category ?? "",
  };
}

export async function searchNearbyPlaces(
  latOrOptions,
  lon,
  radius = 5000,
  category = ""
) {
  const options = normalizeArguments(latOrOptions, lon, radius, category);
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("Nearby search is temporarily unavailable. Configure GEOAPIFY_API_KEY on the server.");
  }

  const { lat, lon: longitude } = options;
  const searchRadius = Math.min(Math.max(options.radius || 5000, 100), 50_000);
  const normalizedCategory = String(options.category || "").trim().toLowerCase();

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(longitude) ||
    lat < -90 ||
    lat > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Search latitude and longitude are invalid.");
  }

  const categories = normalizedCategory
    ? CATEGORY_MAP[normalizedCategory]
    : ALL_CATEGORIES;

  if (!categories) {
    throw new Error(`Unsupported place category: ${normalizedCategory}`);
  }

  const response = await fetch(`${GEOAPIFY_URL}?apiKey=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      categories,
      filter: {
        type: "circle",
        lon: longitude,
        lat,
        radius: searchRadius,
      },
      bias: {
        type: "proximity",
        lon: longitude,
        lat,
      },
      limit: 100,
      lang: "en",
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.message ||
      data.error ||
      `Geoapify API error: ${response.status}`;

    throw new Error(message);
  }

  const features = Array.isArray(data.features) ? data.features : [];

  return features
    .map((feature) => {
      const properties = feature.properties || {};
      const coordinates = feature.geometry?.coordinates || [];
      const placeLon = Number(coordinates[0]);
      const placeLat = Number(coordinates[1]);

      if (!Number.isFinite(placeLat) || !Number.isFinite(placeLon)) {
        return null;
      }

      return {
        id: properties.place_id || properties.datasource?.raw?.id || "",
        name:
          properties.name ||
          properties.address_line1 ||
          properties.formatted ||
          "Unnamed place",
        lat: placeLat,
        lon: placeLon,
        distanceMeters: getDistanceMeters(lat, longitude, placeLat, placeLon),
        address: properties.formatted || "",
        category: Array.isArray(properties.categories)
          ? properties.categories.join(", ")
          : "",
      };
    })
    .filter(Boolean)
    .sort((first, second) => first.distanceMeters - second.distanceMeters);
}
