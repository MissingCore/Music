/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    borderRadius: {
      none: "0px",
      sm: "4px",
      DEFAULT: "8px",
      lg: "16px",
      full: "9999px",
    },
    colors: {
      canvas: "#000000",

      accent50: "#F28D91",
      accent500: "#D71921",

      tertiary500: "#1D3557",

      foreground50: "#F0F2F2",
      foreground100: "#C1C4C4",

      surface50: "#E7E9E9",
      surface500: "#484949",
      surface800: "#1B1D1F",
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
