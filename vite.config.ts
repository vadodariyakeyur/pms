import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React core together - DO NOT SPLIT
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Group Radix UI components (but keep them separate from React core)
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-avatar',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip'
          ],
          
          // Other heavy libraries
          'pdf-utils': ['jspdf', 'html2canvas-pro'],
          'database': ['@supabase/supabase-js', 'idb'],
          'ui-utils': ['date-fns', 'clsx', 'tailwind-merge', 'lucide-react', 'cmdk', 'react-day-picker', 'react-to-print']
        }
      }
    }
  }
});
