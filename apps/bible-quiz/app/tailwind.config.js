/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf4f3",
          100: "#fce8e6",
          200: "#f9d4d1",
          300: "#f4b4ae",
          400: "#ec8b82",
          500: "#e0635a",
          600: "#cb453c",
          700: "#ab372f",
          800: "#8d312b",
          900: "#752f2a",
          950: "#3f1411",
        },
      },
    },
  },
  plugins: [],
};
