import type { HexColor } from "../core/constants";

/** Normalizes `#RGB` and `#RRGGBB` strings to uppercase `#RRGGBB`. */
export function normalizeHexColor(value: string) {
  const raw = value.trim();
  const shortMatch = /^#([\da-fA-F]{3})$/.exec(raw);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1]!.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase() as HexColor;
  }

  if (!/^#([\da-fA-F]{6})$/.test(raw)) return null;
  return raw.toUpperCase() as HexColor;
}
