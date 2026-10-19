import { createClient } from "@supabase/supabase-js";
import config from "../config.js";

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
  throw new Error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment."
  );
}

// Server-side only: service role key ko public/js ya HTML files mein kabhi na rakhein.
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
