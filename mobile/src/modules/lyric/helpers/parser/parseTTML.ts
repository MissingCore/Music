// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { SynchronizedLine, SynchronizedWord } from "./utils";
import { parseTimestampAsMS } from "./utils";

/** Identifies a lyric line, which may contain words in the form of `<span>`. */
const PLineRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
/**
 * Identifies the representation of a word (or group of words if we get a nested span).
 * Since it's evaluated from left-to-right, we ensure nested span matches are returned first.
 */
const SpanLineRegex =
  /<span\b([^>]*)>([\s\S]*?)(<\/span>\s*){2}|<span\b([^>]*)>([\s\S]*?)<\/span>\s*/g;
/** Identifies inner span contents. */
const SpanContentsRegex = /<span\b[^>]*>(.*)<\/span>(\s)*/;

/** Identifies the HTML tag portion. */
const HTMLTagRegex = /<[^>]*>/g;
/** Identifies the attributes in a HTML tag. */
const HTMLAttributeRegex = /(\w+)="([^"]*)"/g;

export function parseTTML(lyrics: string): SynchronizedLine[] {
  const formattedLines: SynchronizedLine[] = [];

  const lines = Array.from(lyrics.match(PLineRegex) ?? []);

  //? Helper for tracking what goes in a `SynchronizedLine`.
  let lineWords: SynchronizedWord[] = [];
  const parseAndPushWord = (wordLine: string) => {
    const attributes = parseAttributes(wordLine);
    if (!attributes.begin) return;
    lineWords.push({
      timeMS: parseTimestampAsMS(attributes.begin),
      word: wordLine.replace(HTMLTagRegex, ""),
    });
  };
  const pushLine = () => {
    if (lineWords.length === 0) return;
    formattedLines.push({ timeMS: lineWords[0]!.timeMS, words: lineWords });
    lineWords = [];
  };

  for (const line of lines) {
    const lineAttributes = parseAttributes(line);
    if (!lineAttributes.begin) continue;

    const startMS = parseTimestampAsMS(lineAttributes.begin);
    const wordLines = line.match(SpanLineRegex);

    if (wordLines) {
      for (const wordLine of wordLines) {
        if (wordLine.split("</span>").length - 1 === 1) {
          //? Typical case of no nested spans.
          parseAndPushWord(wordLine);
        } else {
          //? Case with nested spans, in which we create a new line.
          pushLine();

          const newLine = wordLine.match(SpanContentsRegex);
          if (!newLine) continue;
          //? Trailing space we want to add to the last word of this new line.
          const trailingSpace = newLine[2] ?? "";

          newLine[1]?.match(SpanLineRegex)?.forEach(parseAndPushWord);
          if (lineWords.at(-1)) lineWords.at(-1)!.word += trailingSpace;

          pushLine();
        }
      }

      pushLine();
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
