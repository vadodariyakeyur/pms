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
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        material: {
          DEFAULT: "rgb(var(--material-bg))",
          heavy: "rgb(var(--material-bg-heavy))",
          border: "rgb(var(--material-border))",
        },
        // Chart vars are hex (read directly by Recharts) — no alpha modifier used.
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "rgb(var(--sidebar) / <alpha-value>)",
          foreground: "rgb(var(--sidebar-foreground) / <alpha-value>)",
          primary: "rgb(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "rgb(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "rgb(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "rgb(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "rgb(var(--sidebar-border) / <alpha-value>)",
          ring: "rgb(var(--sidebar-ring) / <alpha-value>)",
        },
      },
      transitionTimingFunction: {
        spring: "var(--ease-spring)",
        "spring-bounce": "var(--ease-spring-bounce)",
        "out-quart": "var(--ease-out-quart)",
        "in-quart": "var(--ease-in-quart)",
      },
      transitionDuration: {
        fast: "var(--response-fast)",
        response: "var(--response)",
        slow: "var(--response-slow)",
      },
      backdropBlur: {
        material: "var(--material-blur)",
        "material-heavy": "var(--material-blur-heavy)",
      },
      letterSpacing: {
        display: "-0.021em",
        heading: "-0.014em",
        body: "0em",
        caption: "0.01em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      // Slightly stronger than Tailwind's defaults so cards read as raised in
      // light mode. Shadows are invisible on the near-black dark palette, which
      // separates surfaces by background value instead.
      boxShadow: {
        xs: "0px 1px 2px 0px hsl(240 6% 10% / 0.06)",
        sm: "0px 1px 2px 0px hsl(240 6% 10% / 0.08), 0px 1px 3px 0px hsl(240 6% 10% / 0.10)",
        DEFAULT:
          "0px 1px 2px 0px hsl(240 6% 10% / 0.08), 0px 1px 3px 0px hsl(240 6% 10% / 0.10)",
        md: "0px 2px 4px -1px hsl(240 6% 10% / 0.08), 0px 4px 6px -1px hsl(240 6% 10% / 0.10)",
        lg: "0px 4px 6px -2px hsl(240 6% 10% / 0.08), 0px 10px 15px -3px hsl(240 6% 10% / 0.10)",
      },
    },
  },
  plugins: [],
};
