import type { Config } from "drizzle-kit";
export default {
  schema: "./src/db/schema.ts",
  out: "./src/drizzle",
  driver: "expo",
} satisfies Config;
