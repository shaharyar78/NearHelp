const CATEGORY_TAGS = {
  hospital: [["amenity", "hospital|clinic|doctors"]],
  pharmacy: [["amenity", "pharmacy"]],
  police: [["amenity", "police"]],
  fire_station: [["amenity", "fire_station"]],
  shelter: [
    ["amenity", "shelter"],
    ["social_facility", "shelter"],
  ],
  food: [["amenity", "restaurant|cafe|food_court"]],
  shop: [["shop", ".+"]],

  school: [["amenity", "school"]],
  college: [["amenity", "college|university"]],
  court: [["amenity", "courthouse"]],
  bank: [["amenity", "bank"]],
  atm: [["amenity", "atm"]],
  bus_station: [["amenity", "bus_station"]],
  train_station: [["railway", "station|halt"]],
  parking: [["amenity", "parking"]],
  library: [["amenity", "library"]],
};

const ALL_TAGS = Object.values(CATEGORY_TAGS).flat();

export function getOverpassTags(category) {
  if (!category) return ALL_TAGS;

  const tags = CATEGORY_TAGS[String(category).trim().toLowerCase()];

  if (!tags) {
    const error = new Error("Place category is invalid.");
    error.statusCode = 400;
    throw error;
  }

  return tags;
}

export function getAvailableCategories() {
  return Object.keys(CATEGORY_TAGS);
}
