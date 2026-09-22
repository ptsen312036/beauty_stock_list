import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

if (import.meta.env.DEV) {
  // Debugging convenience only — lets us inspect the session/JWT from the browser console.
  (window as unknown as { supabase: typeof supabase }).supabase = supabase;
}
