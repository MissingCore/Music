/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    borderRadius: {
      none: "0",
      sm: "4px",
      DEFAULT: "8px",
      lg: "16px",
      full: "9999px",
    },
    colors: {
      canvas: "#000000",
      accent: "#D71921",
      foreground: "#F0F2F2",
      foregroundSoft: "#C1C4C4",
      surfaceDim: "#1B1D1F",
      surface: "#484949",
      surfaceBright: "#E7E9E9",
    },
    fontSize: {
      title: "32px",
      subtitle: "28px",
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "20px",
      xl: "24px",
    },
    fontFamily: {
      geistMonoLight: "GeistMonoLight",
      geistMono: "GeistMono",
      geistMonoMedium: "GeistMonoMedium",
      ndot57: "Ndot57",
    },
    extend: {},
  },
  plugins: [],
};
