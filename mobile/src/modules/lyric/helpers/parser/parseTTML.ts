// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { SynchronizedLine, SynchronizedWord } from "./utils";
import { parseTimestampAsMS } from "./utils";

/** Identifies a lyric line, which may contain words in the form of `<span>`. */
const PLineRegex = /<p\b([^>]*)>(.*?)<\/p>/g;
/** Identifies the representation of a word. */
const SpanLineRegex = /<span\b([^>]*)>(.*?)<\/span>\s*/g;

/** Identifies the HTML tag portion. */
const HTMLTagRegex = /<[^>]*>/g;
/** Identifies the attributes in a HTML tag. */
const HTMLAttributeRegex = /(\w+)="([^"]*)"/g;

export function parseTTML(lyrics: string): SynchronizedLine[] {
  const formattedLines: SynchronizedLine[] = [];

  const lines = Array.from(lyrics.match(PLineRegex) ?? []);

  for (const line of lines) {
    const lineAttributes = parseAttributes(line);
    if (!lineAttributes.begin) continue;

    const startMS = parseTimestampAsMS(lineAttributes.begin);
    const wordLines = line.match(SpanLineRegex);

    if (wordLines) {
      const syncWords: SynchronizedWord[] = wordLines
        .map((wordLine) => {
          const attributes = parseAttributes(wordLine);
          if (!attributes.begin) return;
          return {
            timeMS: parseTimestampAsMS(attributes.begin),
            word: wordLine.replace(HTMLTagRegex, ""),
          };
        })
        .filter((word) => word !== undefined);

      formattedLines.push({ timeMS: startMS, words: syncWords });
    } else {
      formattedLines.push({
        timeMS: startMS,
        words: [{ timeMS: startMS, word: line.replace(HTMLTagRegex, "") }],
      });
    }
  }

  return formattedLines;
}

//#region Helpers
/** Parse the "attributes" from the starting HTML tag in the segment. */
function parseAttributes(segment: string): Record<string, string> {
  const startingTag = segment.match(HTMLTagRegex)?.[0];
  if (!startingTag) return {};
  return Object.fromEntries(
    Array.from(startingTag.matchAll(HTMLAttributeRegex), ([_, key, val]) => [
      key,
      val,
    ]),
  );
}
//#endregion
