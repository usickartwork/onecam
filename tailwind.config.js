/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        cam: {
          bg: "#0a0a0a",
          surface: "#141414",
          card: "#1e1e1e",
          border: "#2a2a2a",
          muted: "#6b6b6b",
          accent: "#e8d5b7",
        },
      },
    },
  },
  plugins: [],
};
