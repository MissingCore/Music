// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";

import { db } from "~/db";
import { tracksToLyrics } from "~/db/schema";

import i18next from "~/modules/i18n";
import { queries as q } from "~/data/keyStore";

import { queryClient } from "~/lib/react-query";

export async function linkTrackToLyric(
  entry: { name: string; trackId: string; lyricId: string },
  toastLinkage = true,
) {
  const { name, ...trackLyricRel } = entry;

  // Upsert track-lyric relation.
  await db
    .insert(tracksToLyrics)
    .values(trackLyricRel)
    .onConflictDoUpdate({
      target: [tracksToLyrics.trackId],
      set: { lyricId: entry.lyricId },
    });

  queryClient.invalidateQueries({
    queryKey: q.lyrics.detail(entry.lyricId).queryKey,
  });
  if (toastLinkage) toast(i18next.t("template.entryAdded", { name }));
}
