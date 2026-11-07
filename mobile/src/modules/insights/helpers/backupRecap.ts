// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useMutation } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { db } from "~/db";
import { tracks, tracksPlayEvents } from "~/db/schema";

import i18next from "~/modules/i18n";
import { preferenceStore } from "~/stores/Preference/store";
import { sessionStore } from "~/stores/Session/store";

import { pickDirectory, pickFile } from "~/lib/file-system";
import { clearAllQueries } from "~/lib/react-query";
import { Epoch, Months } from "~/utils/date";
import { chunkArray } from "~/utils/object";
import { FormSchema } from "~/modules/form/utils";
import { RECENT_RANGE_MS } from "../core/constants";

const BackupSchema = v.object({
  version: FormSchema.RealNumber,
  exportedAt: FormSchema.NonEmptyString,

  backup: v.array(
    v.object({
      //? Used to prevent potential inflation from the merging.
      id: FormSchema.NonEmptyString,
      trackUri: FormSchema.NonEmptyString,
      playedAt: FormSchema.RealNumber,
      playTime: FormSchema.RealNumber,
    }),
  ),
});

//#region Export
async function exportRecapBackup() {
  const recapEntries = await db
    .select({
      id: tracksPlayEvents.id,
      trackUri: tracks.uri,
      playedAt: tracksPlayEvents.playedAt,
      playTime: tracksPlayEvents.playTime,
    })
    .from(tracksPlayEvents)
    .innerJoin(tracks, eq(tracksPlayEvents.trackId, tracks.id));

  // User selects location to save this backup file.
  const dir = await pickDirectory();

  // Create a new file in specified directory & write contents.
  const backupFile = dir.createFile("music_recap_backup", "application/json");
  await backupFile.write(
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toString(),

      backup: recapEntries,
    } satisfies v.InferOutput<typeof BackupSchema>),
  );
}
//#endregion

//#region Import
async function importRecapBackup() {
  const backupFile = await pickFile([
    "application/json",
    "application/octet-stream",
  ]);

  // Read, parse, and validate file contents.
  let _backupContents;
  try {
    // Validate the data structure.
    _backupContents = v.parse(BackupSchema, await backupFile.json());
  } catch {
    throw new Error(i18next.t("err.msg.invalidStructure"));
  }
  const backupContents = _backupContents.backup;

  // Ensure we import the values for tracks we know.
  const tracksByUri = new Map(
    (
      await db.query.tracks.findMany({
        columns: { id: true, uri: true },
      })
    ).map(({ id, uri }) => [uri, id]),
  );
  const validEntries = backupContents.flatMap(({ trackUri, ...entry }) => {
    const trackId = tracksByUri.get(trackUri);
    return trackId ? [{ ...entry, trackId }] : [];
  });

  if (validEntries.length === 0) return false;
  const recapBatches = chunkArray(validEntries, 200);
  for (const chunk of recapBatches) {
    await db.insert(tracksPlayEvents).values(chunk).onConflictDoNothing();
  }
  return true;
}
//#endregion

export const useExportRecapBackup = () => {
  return useMutation({
    mutationFn: exportRecapBackup,
    onSuccess: () => {
      toast.t("feat.backup.extra.exportSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

export const useImportRecapBackup = () => {
  return useMutation({
    mutationFn: importRecapBackup,
    onSuccess: async (hasImportedData) => {
      if (hasImportedData) {
        //? Refresh cached recap ranges.
        const firstPlayEvent = await db.query.tracksPlayEvents.findFirst({
          orderBy: (fields, { asc }) => asc(fields.playedAt),
        });

        const todayDate = new Date();
        const month = todayDate.getMonth();
        const year = todayDate.getFullYear();
        const endMonth = month === 11 ? 0 : month + 1;
        const endYear = month === 11 ? year + 1 : year;

        const startRecapFrom = firstPlayEvent?.playedAt ?? Date.now();

        sessionStore.setState({
          recapStartEpoch: firstPlayEvent?.playedAt ?? Date.now(),
          lastDaysStartEpoch: Date.now() - RECENT_RANGE_MS,
          defaultRecapRange: {
            rangeLabel: `${Months[month]} ${year}`,
            startEpoch: Epoch.from({ month, year }),
            endEpoch: Epoch.from({ month: endMonth, year: endYear }),
          },
        });

        const optimizeInsightsFromDate = new Date(startRecapFrom);
        preferenceStore.setState({
          optimizeInsightsFrom: Epoch.from({
            month: optimizeInsightsFromDate.getMonth(),
            year: optimizeInsightsFromDate.getFullYear(),
          }),
        });
      }

      //? Then do the typical reset + success toast.
      clearAllQueries();
      toast.t("feat.backup.extra.importSuccess");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};
