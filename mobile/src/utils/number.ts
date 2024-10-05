/** Abbreviate large numbers. */
export function abbreviateNum(num: number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

/** Abbreviate size in bytes. */
export function abbreviateSize(size: number) {
  if (size >= 1e9) {
    return `${(size / 1e9).toFixed(2)} GB`;
  } else if (size >= 1e6) {
    return `${(size / 1e6).toFixed(2)} MB`;
  } else if (size >= 1e3) {
    return `${(size / 1e3).toFixed(2)} KB`;
  } else {
    return `${size} B`;
  }
}

/**
 * Convert seconds into a string representing the number of days, hours,
 * and minutes from seconds.
 */
export function formatSeconds(duration: number) {
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
