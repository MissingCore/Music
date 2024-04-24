/** @description Abbreviate large numbers. */
export function abbreviateNum(num: number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}
