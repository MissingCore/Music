// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { SynchronizedLine, SynchronizedWord } from "./utils";
import { parseTimestampAsMS } from "./utils";

/** Identifies the start of a lyric line (a timestamp). */
const LRCLineRegex = /^\[([0-9]+:[0-9]+(?:\.[0-9]+)?)\](.*)/;
/** Identifies the timestamps in the LRC A2 format. */
const A2TimestampRegex = /(?:\[|<)[0-9]+:[0-9]+(?:\.[0-9]+)?(?:\]|>)/g;

/**
 * Supports parsing the following formats:
 *  - **LRC:** `[mm:ss]`, `[mm:ss.xx]`, `[mm:ss.xxx]`
 *  - **LRC A2:** `[mm:ss.xx] <mm:ss.xx>`, `[mm:ss.xx] [mm:ss.xx]`
 */
export function parseLRC(lyrics: string): SynchronizedLine[] {
  const formattedLines: SynchronizedLine[] = [];

  //? Get tuple of timestamp & lyric line content.
  const lines = lyrics
    .split("\n")
    .map((line) => {
      const parsedLine = line.match(LRCLineRegex);
      if (!parsedLine || !parsedLine[1] || !parsedLine[2]) return undefined;
      return [parsedLine[1], parsedLine[2].trim()] as [string, string];
    })
    .filter((line) => line !== undefined);

  for (const [timestamp, lineContent] of lines) {
    const startMS = parseTimestampAsMS(timestamp);

    //? See if the lyrics are in A2 format.
    const a2LRCTimestamps = lineContent.match(A2TimestampRegex);
    if (a2LRCTimestamps) {
      //? Get words after each timestamp. We expect `a2LRCTimestamps` &
      //? `words` to have the same length.
      const [firstWord, ...words] = lineContent.split(A2TimestampRegex);

      const syncWords: SynchronizedWord[] = a2LRCTimestamps
        .map((timestamp, idx) => {
          const word = words[idx];
          if (word === undefined) return;
          return { timeMS: parseTimestampAsMS(timestamp), word };
        })
        .filter((word) => word !== undefined);

      //? Assign the first word (could be an empty string) the line's timestamp.
      if (firstWord) syncWords.unshift({ timeMS: startMS, word: firstWord });

      formattedLines.push({ timeMS: startMS, words: syncWords });
    } else {
      formattedLines.push({
        timeMS: startMS,
        words: [{ timeMS: startMS, word: lineContent }],
      });
    }
  }

  return formattedLines;
}
