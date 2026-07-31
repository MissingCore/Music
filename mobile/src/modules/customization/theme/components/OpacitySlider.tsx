//#region Helpers
/** Returns a value between 0 (0x00) & 1 (0xFF), rounded to 2 decimal places. */
function hexToAlpha(hex: string) {
  if (hex.length !== 2) return 1;
  return +(parseInt(hex, 16) / 255).toFixed(2);
}

/** Returns a value between 0x00 (0) & 0xFF (1). */
function alphaToHex(alpha: number) {
  if (alpha < 0 || alpha > 1) return "FF";
  return Math.round(alpha * 255) // Round to prevent hexadecimal fractions
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}
//#endregion
