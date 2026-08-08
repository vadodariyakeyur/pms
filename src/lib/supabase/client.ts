import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Interceptor: fetch only rejects on genuine network failure (offline, DNS,
// server unreachable) — HTTP 4xx/5xx resolve normally — so a throw here means
// the request never reached the server. Toast once (stable id collapses the
// storm of parallel/debounced requests into a single toast) and re-throw so
// every caller's existing catch block still runs its cleanup.
const offlineAwareFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (err) {
    if (!(err instanceof DOMException && err.name === "AbortError")) {
      toast.error("No internet connection. Please try again.", {
        id: "network-offline",
      });
    }
    throw err;
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: { fetch: offlineAwareFetch },
});
