const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  supabaseUrl: "https://jeburohgwisyzjoevnbb.supabase.co" || "",
  supabaseAnonKey: "sb_publishable_586bWNQB7Z61Y6hODyYgNw_fJG5K0I6" || "",
  supabaseServiceRoleKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYnVyb2hnd2lzeXpqb2V2bmJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE1NjUwMCwiZXhwIjoyMTA3NzMyNTAwfQ.glncW1E4eBvd8wMrEqSJuhjevo-vsVRIeGz3KgcYbOs" || "",
  jwtSecret:"10db88f0-fd87-4b3a-a301-e3ac261b8957" || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  overpassApiUrl:
    process.env.OVERPASS_API_URL ||
    "https://overpass-api.de/api/interpreter",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
};

export default config;
