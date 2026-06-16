import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

// Singleton browser client.
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  { auth: { persistSession: true, autoRefreshToken: true } },
);

export const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6885b96b`;
