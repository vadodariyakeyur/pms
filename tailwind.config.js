/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        background: "color-mix(in srgb, var(--background) calc(<alpha-value> * 100%), transparent)",
        foreground: "color-mix(in srgb, var(--foreground) calc(<alpha-value> * 100%), transparent)",
        card: {
          DEFAULT: "color-mix(in srgb, var(--card) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--card-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        popover: {
          DEFAULT: "color-mix(in srgb, var(--popover) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--popover-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        primary: {
          DEFAULT: "color-mix(in srgb, var(--primary) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--primary-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        secondary: {
          DEFAULT: "color-mix(in srgb, var(--secondary) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--secondary-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        muted: {
          DEFAULT: "color-mix(in srgb, var(--muted) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--muted-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        accent: {
          DEFAULT: "color-mix(in srgb, var(--accent) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--accent-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        destructive: {
          DEFAULT: "color-mix(in srgb, var(--destructive) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--destructive-foreground) calc(<alpha-value> * 100%), transparent)",
        },
        border: "color-mix(in srgb, var(--border) calc(<alpha-value> * 100%), transparent)",
        input: "color-mix(in srgb, var(--input) calc(<alpha-value> * 100%), transparent)",
        ring: "color-mix(in srgb, var(--ring) calc(<alpha-value> * 100%), transparent)",
        chart: {
          1: "color-mix(in srgb, var(--chart-1) calc(<alpha-value> * 100%), transparent)",
          2: "color-mix(in srgb, var(--chart-2) calc(<alpha-value> * 100%), transparent)",
          3: "color-mix(in srgb, var(--chart-3) calc(<alpha-value> * 100%), transparent)",
          4: "color-mix(in srgb, var(--chart-4) calc(<alpha-value> * 100%), transparent)",
          5: "color-mix(in srgb, var(--chart-5) calc(<alpha-value> * 100%), transparent)",
        },
        sidebar: {
          DEFAULT: "color-mix(in srgb, var(--sidebar) calc(<alpha-value> * 100%), transparent)",
          foreground: "color-mix(in srgb, var(--sidebar-foreground) calc(<alpha-value> * 100%), transparent)",
          primary: "color-mix(in srgb, var(--sidebar-primary) calc(<alpha-value> * 100%), transparent)",
          "primary-foreground": "color-mix(in srgb, var(--sidebar-primary-foreground) calc(<alpha-value> * 100%), transparent)",
          accent: "color-mix(in srgb, var(--sidebar-accent) calc(<alpha-value> * 100%), transparent)",
          "accent-foreground": "color-mix(in srgb, var(--sidebar-accent-foreground) calc(<alpha-value> * 100%), transparent)",
          border: "color-mix(in srgb, var(--sidebar-border) calc(<alpha-value> * 100%), transparent)",
          ring: "color-mix(in srgb, var(--sidebar-ring) calc(<alpha-value> * 100%), transparent)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
    },
  },
  plugins: [],
};
