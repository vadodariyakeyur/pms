import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest owns `src/**` only. Without this, its default include also matches
 * `e2e/*.spec.ts`, which are Playwright tests and throw the moment Vitest
 * imports them.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Importing anything that reaches `supabase/client.ts` builds the client,
    // which throws without a URL. CI has no `.env`; tests never hit the network.
    env: {
      VITE_SUPABASE_URL: "https://test-project.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
