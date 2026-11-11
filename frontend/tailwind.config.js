/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5f6FFF",
          light: "#eaefff",
          dark: "#4f46e5",
        },
        ink: "#1f2937",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Arial", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      maxWidth: {
        container: "1100px",
      },
    },
  },
  plugins: [],
};