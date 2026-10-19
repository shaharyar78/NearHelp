import { searchNearbyPlaces } from "../utils/overpass.js";
import { distanceInMeters } from "../utils/distance.js";
import { supabase } from "../db/supabase.js";

export async function searchPlaces(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const radius = Number(req.query.radius ?? 5000);
    const category = String(req.query.category ?? "");

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        error: "Enter a valid latitude and longitude.",
      });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180 || !Number.isFinite(radius) || radius < 100 || radius > 50_000) {
      return res.status(400).json({ error: "Location or search radius is out of range." });
    }

    const externalPlaces = ["court", "other"].includes(category)
      ? []
      : await searchNearbyPlaces({ lat, lon, radius, category });

    const latitudeDelta = radius / 111_320;
    const longitudeScale = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
    const longitudeDelta = radius / (111_320 * longitudeScale);
    let communityQuery = supabase
      .from("community_places")
      .select("id, name, category, address, lat, lon")
      .eq("status", "approved")
      .gte("lat", Math.max(-90, lat - latitudeDelta))
      .lte("lat", Math.min(90, lat + latitudeDelta))
      .gte("lon", Math.max(-180, lon - longitudeDelta))
      .lte("lon", Math.min(180, lon + longitudeDelta))
      .limit(500);
    if (category) communityQuery = communityQuery.eq("category", category);

    const { data: communityPlaces, error: communityError } = await communityQuery;
    if (communityError) throw communityError;

    const localPlaces = (communityPlaces || [])
      .map((place) => ({
        ...place,
        id: `community-${place.id}`,
        distanceMeters: distanceInMeters(lat, lon, place.lat, place.lon),
      }))
      .filter((place) => place.distanceMeters <= radius);
    const places = [...externalPlaces, ...localPlaces].sort(
      (first, second) => first.distanceMeters - second.distanceMeters
    );

    return res.json({ places });
  } catch (error) {
    next(error);
  }
}

export async function getPlaceById(req, res, next) {
  try {
    const id = String(req.params.id ?? "").trim();

    if (!id) {
      return res.status(400).json({ error: "Place ID is required." });
    }

    // Community-submitted places are stored locally, keyed with a `community-` prefix.
    if (id.startsWith("community-")) {
      const communityId = id.slice("community-".length);

      const { data: place, error } = await supabase
        .from("community_places")
        .select("id, name, category, address, lat, lon, status")
        .eq("id", communityId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) throw error;
      if (!place) {
        return res.status(404).json({ error: "Place details were not found." });
      }

      return res.json({
        place: {
          ...place,
          id: `community-${place.id}`,
          name: place.name || "Community place",
        },
      });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Place details are temporarily unavailable. Configure GEOAPIFY_API_KEY on the server.",
      });
    }

    const url = new URL("https://api.geoapify.com/v2/place-details");
    url.searchParams.set("id", id);
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || `Geoapify error: ${response.status}`,
      });
    }

    const feature = data.features?.[0];

    if (!feature) {
      return res.status(404).json({ error: "Place details were not found." });
    }

    const properties = feature.properties || {};
    const [lon, lat] = feature.geometry?.coordinates || [];

    return res.json({
      place: {
        ...properties,
        id: properties.place_id || id,
        name: properties.name || properties.address_line1 || "Place",
        lat,
        lon,
        address: properties.formatted || "",
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function submitCommunityPlace(req, res, next) {
  try {
    const name = String(req.body.name ?? "").trim();
    const category = String(req.body.category ?? "").trim().toLowerCase();
    const address = String(req.body.address ?? "").trim();
    const lat = Number(req.body.lat);
    const lon = Number(req.body.lon);

    const allowedCategories = [
      "hospital",
      "pharmacy",
      "police",
      "fire_station",
      "shelter",
      "food",
      "shop",
      "bank",
      "atm",
      "bus_station",
      "train_station",
      "parking",
      "library",
      "school",
      "college",
      "court",
      "other",
    ];

    if (name.length < 2 || name.length > 120) {
      return res.status(400).json({
        error: "Place name must be between 2 and 120 characters.",
      });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: "Choose a valid place category." });
    }

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({ error: "Enter valid location coordinates." });
    }

    if (address.length > 200) {
      return res.status(400).json({ error: "Address must be 200 characters or fewer." });
    }

    const { data: place, error } = await supabase
      .from("community_places")
      .insert({
        name,
        category,
        address,
        lat,
        lon,
        submitted_by: req.user.id,
        status: "pending",
      })
      .select("id, name, category, address, status, created_at")
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: "Place submitted for review.",
      place,
    });
  } catch (error) {
    next(error);
  }
}
