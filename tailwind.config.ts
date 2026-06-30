import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f5f7",
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.06)",
        cardHover: "0 6px 16px rgba(16,24,40,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
