// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { SynchronizedLine, SynchronizedWord } from "./utils";
import { parseTimestampAsMS } from "./utils";

/** Identifies the start of a lyric line. */
const P_LINE_START = /<p\b([^>]*)>(.*?)<\/p>/g;
/** Identifies the start of a word. */
const SPAN_LINE_START = /<span\b([^>]*)>(.*?)<\/span>/g;

/** Identifies the attributes in a tag. */
const ATTRIBUTE = /(\w+)="([^"]*)"/g;
/** Identifies the HTML tag portion. */
const TAG = /<[^>]*>/g;

export function parseTTML(lyrics: string): SynchronizedLine[] {
  const formattedLines: SynchronizedLine[] = [];

  const lines = Array.from(lyrics.match(P_LINE_START) ?? []);
  for (const line of lines) {
    const lineAttributes = parseAttributes(line);
    if (!lineAttributes.begin) continue;

    const startMS = parseTimestampAsMS(lineAttributes.begin);
    const wordLines = line.match(SPAN_LINE_START);

    if (wordLines) {
      const syncWords: SynchronizedWord[] = wordLines
        .map((wordLine) => {
          const attributes = parseAttributes(wordLine);
          if (!attributes.begin) return;
          return {
            timeMS: parseTimestampAsMS(attributes.begin),
            word: wordLine.replace(TAG, "") + " ",
          };
        })
        .filter((word) => word !== undefined);

      formattedLines.push({ timeMS: startMS, words: syncWords });
    } else {
      formattedLines.push({
        timeMS: startMS,
        words: [{ timeMS: startMS, word: line.replace(TAG, "") }],
      });
    }
  }

  return formattedLines;
}

//#region Helpers
/** Parse the "attributes" from the starting HTML tag in the segment. */
function parseAttributes(segment: string): Record<string, string> {
  const startingTag = segment.match(TAG)?.[0];
  if (!startingTag) return {};
  return Object.fromEntries(
    Array.from(startingTag.matchAll(ATTRIBUTE), ([_, key, val]) => [key, val]),
  );
}
//#endregion
