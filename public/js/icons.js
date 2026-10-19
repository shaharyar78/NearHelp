const CATEGORY_ICONS = {
  hospital: "🏥",
  pharmacy: "💊",
  police: "🚓",
  fire_station: "🚒",
  shelter: "🏠",
  food: "🍽️",
  shop: "🛒",
  bank: "🏦",
  atm: "💳",
  bus_station: "🚌",
  train_station: "🚉",
  parking: "🅿️",
  library: "📚",
  school: "🏫",
  college: "🎓",
  court: "⚖️",
  other: "📍",
};

const CATEGORY_LABELS = {
  hospital: "Hospital / clinic",
  pharmacy: "Pharmacy",
  police: "Police station",
  fire_station: "Fire station",
  shelter: "Shelter",
  food: "Food",
  shop: "Shop",
  bank: "Bank",
  atm: "ATM",
  bus_station: "Bus station",
  train_station: "Train station",
  parking: "Parking",
  library: "Library",
  school: "School",
  college: "College",
  court: "Court",
  other: "Community place",
};

export function categoryIcon(category) {
  return CATEGORY_ICONS[String(category || "").trim().toLowerCase()] || "📍";
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[String(category || "").trim().toLowerCase()] || "Place";
}
