import type { Config } from "tailwindcss";

import { TailwindTheme } from "./src/constants/TailwindTheme";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: TailwindTheme,
  plugins: [],
} satisfies Config;
