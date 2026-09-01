//#region Constants
export const Months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
//#endregion

export const Epoch = {
  /**
   * Get the epoch time from a day, month, and year.
   *  - Month is from 0-11, with everything else being "normal".
   */
  from: ({ day = 1, month = 0, year = 2026 }) => {
    return new Date(year, month, day).getTime();
  },

  /** Convert epoch time to `YYYY-MM-DD` */
  toDateAbbreviation: (ms: number) => {
    const date = new Date(ms);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  },
};

export const Seconds = {
  /**
   * Automatically convert seconds to a readable format. If less than than
   * 24 hours, display as `hh:mm:ss`, otherwise, `d hr min`.
   */
  toReadableTime: (seconds: number) => {
    let roundedSeconds = Math.floor(seconds);

    const days = Math.floor(roundedSeconds / (24 * 3600));
    roundedSeconds -= days * 24 * 3600;
    const hours = Math.floor(roundedSeconds / 3600);
    roundedSeconds -= hours * 3600;
    const minutes = Math.floor(roundedSeconds / 60);
    roundedSeconds -= minutes * 60;

    const asISO = days < 1;

    const timeStr: string[] = [];
    pushTimeSegment(timeStr, days, !asISO ? "d" : undefined);
    pushTimeSegment(timeStr, hours, !asISO ? "hr" : undefined);
    // Ensure minutes is present in returned string.
    pushTimeSegment(timeStr, minutes, !asISO ? "min" : undefined, true);
    if (asISO) pushTimeSegment(timeStr, roundedSeconds);

    return timeStr.join(!asISO ? " " : ":");
  },
};

//#region Internal Helpers
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
//#endregion
