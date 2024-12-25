/** Abbreviate large numbers. */
export function abbreviateNum(num: number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

/** Convert bit rate to kbit/s. */
export function abbreviateBitRate(rate: number) {
  return `${(rate / 1000).toFixed(2).replace(".00", "")} kbit/s`;
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

/** Convert epoch time to `YYYY-MM-DD` */
export function formatEpoch(ms: number) {
  const date = new Date(ms);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Convert seconds into a time representing in the format of: `dd:hh:mm:ss`
 * or `d h min sec`.
 */
export function formatSeconds(
  seconds: number,
  options?: { format?: "colon" | "duration"; omitSeconds?: boolean },
) {
  const config = { format: "colon", omitSeconds: false, ...options };
  let roundedSeconds = Math.floor(seconds);

  const days = Math.floor(roundedSeconds / (24 * 3600));
  roundedSeconds -= days * 24 * 3600;
  const hours = Math.floor(roundedSeconds / 3600);
  roundedSeconds -= hours * 3600;
  const minutes = Math.floor(roundedSeconds / 60);
  roundedSeconds -= minutes * 60;

  const timeStr: string[] = [];
  const withSuffix = config.format === "duration";
  pushTimeSegment(timeStr, days, withSuffix ? "d" : undefined);
  pushTimeSegment(timeStr, hours, withSuffix ? "hr" : undefined);
  // Ensure minutes is present in returned string.
  pushTimeSegment(timeStr, minutes, withSuffix ? "min" : undefined, true);
  if (!config.omitSeconds) {
    pushTimeSegment(timeStr, roundedSeconds, withSuffix ? "s" : undefined);
  }

  return timeStr.join(config.format === "duration" ? " " : ":");
}

/** Helper for `formatSeconds` to make sure we can push a valid value. */
function pushTimeSegment(
  arr: string[],
  length: number,
  suffix: string | undefined = undefined,
  force = false,
) {
  if (!force && length === 0 && arr.length === 0) return;
  const lengthStr =
    arr.length === 0 ? `${length}` : `${length}`.padStart(2, `0`);
  arr.push(lengthStr + (suffix ?? ""));
}
