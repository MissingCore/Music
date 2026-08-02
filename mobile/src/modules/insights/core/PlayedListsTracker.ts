// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { and, eq } from "drizzle-orm";

import { db } from "~/db";
import { playedMediaLists } from "~/db/schema";

import type { PlayFromSource } from "~/stores/Playback/types";

export const PlayedListsTracker = {
  add: async (entry: PlayFromSource) => {
    const lastPlayedAt = Date.now();
    return db
      .insert(playedMediaLists)
      .values({ ...entry, lastPlayedAt })
      .onConflictDoUpdate({
        target: [playedMediaLists.id, playedMediaLists.type],
        set: { lastPlayedAt },
      });
  },

  remove: async (entry: PlayFromSource) => {
    return db
      .delete(playedMediaLists)
      .where(
        and(
          eq(playedMediaLists.id, entry.id),
          eq(playedMediaLists.type, entry.type),
        ),
      );
  },

  update: async (args: {
    oldSource: PlayFromSource;
    newSource: PlayFromSource;
  }) => {
    return db
      .update(playedMediaLists)
      .set(args.newSource)
      .where(
        and(
          eq(playedMediaLists.id, args.oldSource.id),
          eq(playedMediaLists.type, args.oldSource.type),
        ),
      );
  },
};
