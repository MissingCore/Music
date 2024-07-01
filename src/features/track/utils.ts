/**
 * @description String representing the number of days, hours, and minutes
 *  from seconds.
 */
export function getPlayTime(duration: number) {
  const totalSecs = Math.floor(duration);

  const _hours = Math.floor(duration / 3600);
  const minutes = Math.floor((totalSecs - _hours * 3600) / 60);
  const days = Math.floor(_hours / 24);
  const hours = _hours % 24;

  const timeStr = [];
  if (days > 0) timeStr.push(`${days}d`);
  if (hours > 0) timeStr.push(`${hours}hr`);
  timeStr.push(`${minutes}min`);

  return timeStr.join(" ");
}

/** @description Display number of tracks string with correct plurality. */
export function getTrackCountStr(trackCount: number) {
  return `${trackCount} Track${trackCount !== 1 ? "s" : ""}`;
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
