import type { Config } from "tailwindcss";

const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: { bg: v("bg"), panel: v("panel"), ink: v("ink"), muted: v("muted"), line: v("line"),
                brand: v("brand"), onbrand: v("onbrand"), accent: v("accent"), bubble: v("bubble") },
      fontFamily: { body: ["var(--font-body)", "Noto Sans Bengali", "Noto Sans Devanagari", "Noto Sans SC", "system-ui", "sans-serif"],
                    display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
