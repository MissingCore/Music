import type { SynchronizedLine, SynchronizedWord } from "./types";

/** Regex identifying the start of a lyric line (a timestamp). */
const LRC_LINE_START = /^\[[0-9]+:[0-9]+(?:\.[0-9]+)?\]/;
/** Regex identifying the timestamps in the LRC A2 format. */
const LRC_A2_TIMESTAMP = /(?:\[|<)[0-9]+:[0-9]+(?:\.[0-9]+)?(?:\]|>)/g;

/**
 * Supports parsing the following formats:
 *  - **LRC:** `[mm:ss]`, `[mm:ss.xx]`, `[mm:ss.xxx]`
 *  - **LRC A2:** `[mm:ss.xx] <mm:ss.xx>`, `[mm:ss.xx] [mm:ss.xx]`
 */
export function parseLRC(lyrics: string): SynchronizedLine[] {
  const formattedLines: SynchronizedLine[] = [];

  const lines = lyrics.split("\n").map((line) => line.trim());
  for (const line of lines) {
    //? Skip any non-LRC lines (ie: metadata, comments).
    if (!line || !LRC_LINE_START.test(line)) continue;

    const startMS = parseTimestampAsMS(line.match(LRC_LINE_START)![0]);
    const lineContent = line.replace(LRC_LINE_START, "").trim();

    //? See if the lyrics are in A2 format.
    if (LRC_A2_TIMESTAMP.test(lineContent)) {
      const timestampStrs = lineContent.match(LRC_A2_TIMESTAMP);
      if (!timestampStrs || timestampStrs.length === 0) continue;

      //? Get words after each timestamp. We expect `timestampStrs` & `words`
      //? to have the same length.
      const [firstWord, ...words] = lineContent.split(LRC_A2_TIMESTAMP);

      const syncWords: SynchronizedWord[] = timestampStrs
        .map((timestamp, idx) => {
          const word = words[idx];
          if (word === undefined) return;
          return {
            startMS: parseTimestampAsMS(timestamp),
            content: word.trim(),
          };
        })
        .filter((word) => word !== undefined);

      //? Assign the first word (could be an empty string) the line's timestamp.
      if (typeof firstWord === "string") {
        syncWords.unshift({ startMS, content: firstWord });
      }

      formattedLines.push({ startMS, content: syncWords });
    } else {
      formattedLines.push({
        startMS,
        content: [{ startMS, content: lineContent }],
      });
    }
  }

  return formattedLines;
}

//#region Helpers
type Timestamp = [string, string, ...string[]];

/** Regex to extract each timestamp segment. */
const LRC_TIMESTAMP = /[0-9]+/g;

function parseTimestampAsMS(timeStr: string) {
  const [min, sec, ms = "0"] = timeStr.match(LRC_TIMESTAMP) as Timestamp;
  return (
    Number.parseInt(min) * 60 * 1000 +
    Number.parseInt(sec) * 1000 +
    Number.parseInt(ms)
  );
}
//#endregion
