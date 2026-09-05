/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#122622",
        panel: "#eef7f3",
        line: "#c8dcd5",
        brand: "#1c6a61",
        mint: "#8ac7b0",
      },
      boxShadow: {
        soft: "0 24px 70px rgba(9, 44, 40, 0.14)",
      },
    },
  },
  plugins: [],
};
