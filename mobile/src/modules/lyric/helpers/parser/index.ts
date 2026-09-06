// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { parseLRC } from "./parseLRC";
import { parseTTML } from "./parseTTML";
import type { SynchronizedLine } from "./utils";

/** Identifies and returns the lyrics we want to display. */
export function parseLyrics(lyrics: string): string | SynchronizedLine[] {
  if (lyrics.includes("http://www.w3.org/ns/ttml")) {
    const results = parseTTML(lyrics);
    if (results.length > 0) return parseTTML(lyrics);
  }

  //* Current way of testing for `LRC` or `LRC A2` format is to run it
  //* through the parser and see if it returns a result.
  const results = parseLRC(lyrics);
  if (results.length > 0) return results;

  return lyrics;
}
