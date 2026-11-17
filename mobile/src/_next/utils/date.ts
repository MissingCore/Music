// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export const Seconds = {
  /**
   * Automatically convert seconds to a readable format. If less than than
   * 24 hours, display as `hh:mm:ss`, otherwise, `d hr min`.
   */
  toReadableTime: (seconds: number, forceDurationFormat?: boolean) => {
    let roundedSeconds = Math.floor(seconds);

    const days = Math.floor(roundedSeconds / (24 * 3600));
    roundedSeconds -= days * 24 * 3600;
    const hours = Math.floor(roundedSeconds / 3600);
    roundedSeconds -= hours * 3600;
    const minutes = Math.floor(roundedSeconds / 60);
    roundedSeconds -= minutes * 60;

    const asISO = forceDurationFormat ? !forceDurationFormat : days < 1;

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
