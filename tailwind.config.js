/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",  // Include root HTML file
    "./src/**/*.{js,ts,jsx,tsx}",  // Include all JS/TS/React files in src/
  ],
  theme: {
    extend: {
      animation: {
        grid: "grid 15s linear infinite",
      },
      fontFamily: {
        silkscreen: ["Silkscreen", "cursive"],
      },
      keyframes: {
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
