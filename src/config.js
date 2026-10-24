const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  overpassApiUrl:
    process.env.OVERPASS_API_URL ||
    "https://overpass-api.de/api/interpreter",

  geoapifyApiKey: process.env.GEOAPIFY_API_KEY || "",

  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterModel:
    process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
};

export default config;