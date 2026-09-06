// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export type SynchronizedWord = { timeMS: number; word: string };

export type SynchronizedLine = { timeMS: number; words: SynchronizedWord[] };

/** Parses out ms from time string, supporting `mm:ss.xxx` & `ss.xxx`. */
export function parseTimestampAsMS(timeStr: string) {
  const [_nonMSSegments, _msSegment = "000"] = timeStr.split(".");

  //? Extract numeric portions in case we have other characters (ie: brackets).
  const nonMSSegments = _nonMSSegments?.match(/[0-9]+/g);
  const msSegment = _msSegment.match(/[0-9]+/g);

  if (!nonMSSegments) return 0;
  //? We need to pad the end of `ms` to 3 digits.
  const ms = (msSegment?.[0] ?? "000").padEnd(3, "0").slice(0, 3);
  const sec = nonMSSegments.at(-1) ?? "0";
  const min = nonMSSegments.at(-2) ?? "0";

  return (
    Number.parseInt(min) * 60 * 1000 +
    Number.parseInt(sec) * 1000 +
    Number.parseInt(ms)
  );
}
