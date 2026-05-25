/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        imut: {
          primary: "#0ea5e9",
          danger: "#ef4444",
          surface: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
