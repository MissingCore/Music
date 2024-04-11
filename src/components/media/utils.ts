/** @description Returns the number of hours & minutes from seconds. */
export function getPlayTime(duration: number) {
  const totalSecs = Math.floor(duration);

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((totalSecs - hours * 3600) / 60);

  const timeStr = [];
  if (hours > 0) timeStr.push(`${hours}hr`);
  timeStr.push(`${minutes}min`);

  return timeStr.join(" ");
}
