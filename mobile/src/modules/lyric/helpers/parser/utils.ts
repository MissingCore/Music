// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export type SynchronizedWord = { timeMS: number; word: string };

export type SynchronizedLine = { timeMS: number; words: SynchronizedWord[] };

/** Parses out ms from time string, supporting `mm:ss.xxx` & `ss:xxx`. */
export function parseTimestampAsMS(timeStr: string) {
  const timeSegments = timeStr.match(/[0-9]+/g);
  if (!timeSegments) return 0;
  const ms = timeStr.includes(".") ? timeSegments.at(-1)! : "0";
  const sec = timeSegments.at(-2)!;
  const min = timeStr.includes(":") ? timeSegments.at(-3)! : "0";
  return (
    Number.parseInt(min) * 60 * 1000 +
    Number.parseInt(sec) * 1000 +
    Number.parseInt(ms)
  );
}
