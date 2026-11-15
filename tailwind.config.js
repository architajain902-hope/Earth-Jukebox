/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        background: "var(--bg-solid)",
        foreground: "var(--text-primary)",
        card: "var(--surface-glass)",
        border: "var(--surface-border)",
        accent: {
          DEFAULT: "var(--cyan-accent)",
          cool: "var(--color-cool)",
          neutral: "var(--color-neutral)",
          warm: "var(--color-warm)",
          hot: "var(--color-hot)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
    },
  },
  plugins: [],
};
