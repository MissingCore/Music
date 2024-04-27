import type { Config } from "tailwindcss";

import Colors from "./src/constants/Colors";

export default {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/assets/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    borderRadius: {
      none: "0px",
      sm: "4px",
      DEFAULT: "8px",
      md: "12px",
      lg: "16px",
      xl: "24px",
      full: "9999px",
    },
    colors: Colors,
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
  },
  plugins: [],
} satisfies Config;
