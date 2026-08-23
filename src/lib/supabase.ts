import { createClient } from "@supabase/supabase-js";

// These values are intentionally public client configuration. The publishable
// key is safe to ship to the browser; database access is enforced by Supabase
// RLS policies. Environment variables still take precedence for local/preview
// deployments.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  || "https://gayemuprwuwimoqnhici.supabase.co";
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
  || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  || "sb_publishable_GzVnKZTWhJPMazlO7eoqfg_7KUAVvJH";

export const supabase = createClient(url, key);
export const supabaseConfigured = true;
