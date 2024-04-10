/** @description Display number of tracks string with correct plurality. */
export function trackCountStr(numTracks: number) {
  return `${numTracks} Track${numTracks !== 1 ? "s" : ""}`;
}
