import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

// Singleton browser client.
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  { auth: { persistSession: true, autoRefreshToken: true } },
);
