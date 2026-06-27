// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { eq } from "drizzle-orm";

import { db } from "~/db";
import { lyrics } from "~/db/schema";

import { queries as q } from "~/data/keyStore";

import { queryClient } from "~/lib/react-query";

const LRC_LINE_SYNC_TAG = /^\[.+:.+?\]/;

/**
 * Temporary helper to clean up the "junk" in front of embedded synchronized
 * lyrics from before `v3.3.0`.
 *
 * @deprecated Remove in `v4.0.0`.
 */
export async function removeSynchronizedLyricsJunk(lyricId: string) {
  const prevValue = await db.query.lyrics.findFirst({
    where: (fields, { eq }) => eq(fields.id, lyricId),
  });
  if (!prevValue) return;
  const lyricLines = prevValue.lyrics.split("\n").map((line) => line.trim());
  const erroredLines = lyricLines.filter((line) =>
    !line ? false : !LRC_LINE_SYNC_TAG.test(line),
  );

  //? Our cached lyrics created from embedded lyrics starts with "junk"
  //? if all but the first line are identified synchronized.
  if (erroredLines.length !== 1 || lyricLines[0] !== erroredLines[0]) return;

  const erroredLine = erroredLines[0]!;
  //? Replace everything before first `[` with an empty string.
  const updatedLine = erroredLine.replace(/^.*?(?=\[)/, "").trim();

  if (!updatedLine || updatedLine === erroredLine) return;
  await db
    .update(lyrics)
    .set({ lyrics: prevValue.lyrics.replace(erroredLine, updatedLine) })
    .where(eq(lyrics.id, lyricId));

  queryClient.invalidateQueries({ queryKey: q.lyrics._def });
}
