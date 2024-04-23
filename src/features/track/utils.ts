/** @description Display number of tracks string with correct plurality. */
export function getTrackCountStr(numTracks: number) {
  return `${numTracks} Track${numTracks !== 1 ? "s" : ""}`;
}

/** @description Convert seconds in `hh:mm:ss` format. */
export function getTrackDuration(duration: number) {
  let timeStr = new Date(Math.floor(duration) * 1000)
    .toISOString()
    .substring(11, 19);

  // If track isn't an hour long, exclude the "hour" section.
  if (Number(timeStr.slice(0, 2)) === 0) timeStr = timeStr.slice(3);
  return timeStr;
}
