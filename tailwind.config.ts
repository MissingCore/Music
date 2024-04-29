import type { Config } from "tailwindcss";

import TailwindTheme from "./src/constants/TailwindTheme";

export default {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/assets/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: TailwindTheme,
  plugins: [],
} satisfies Config;
