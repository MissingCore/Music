// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { sum } from "drizzle-orm";
import { Directory, Paths } from "expo-file-system";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { db } from "~/db";
import {
  albums,
  artists,
  genres,
  hiddenTracks,
  invalidTracks,
  playlists,
  tracks,
} from "~/db/schema";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import * as SettingsList from "~/navigation/screens/settings/components/SettingsList";

import { Colors } from "~/constants/Styles";
import { ImageDirectory } from "~/lib/file-system";
import type { ExtractQueryData } from "~/lib/react-query";
import { mutateGuard } from "~/lib/react-query";
import { Seconds } from "~/utils/date";
import { abbreviateSize } from "~/utils/number";
import { SegmentedList } from "~/components/List/Segmented";
import {
  LegendItem,
  ProgressBar,
} from "~/components/next/composed/visualization";
import { FontDirectory } from "~/modules/customization/font/core/data";
import { useTheme } from "~/modules/customization/theme/hooks";
import {
  useOptimizableTargetCount,
  useOptimizeDatabase,
} from "../helpers/optimizeDB";

export default function Insights() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <ListLayout>
      <SettingsList.Group>
        <StorageWidget />
        <SettingsList.Divider adjustForIcon={false} />
        <DBSummaryWidget />
        <SettingsList.Divider adjustForIcon={false} />
        <DatabaseOptimizationWidget />
      </SettingsList.Group>

      <SettingsList.Group>
        <SettingsList.Item
          icon="bar-chart-4-bars"
          label={t("feat.recap.title")}
          supporting={t("feat.recap.brief")}
          onPress={() => navigation.navigate("Recap", {})}
        />
      </SettingsList.Group>

      <SettingsList.Group>
        <SettingsList.Item
          icon="visibility-off-filled"
          label={t("feat.hiddenTracks.title")}
          supporting={t("feat.hiddenTracks.brief")}
          onPress={() => navigation.navigate("HiddenTracks")}
        />
        <SettingsList.Divider />
        <SettingsList.Item
          icon="error"
          label={t("feat.saveErrors.title")}
          supporting={t("feat.saveErrors.brief")}
          onPress={() => navigation.navigate("SaveErrors")}
        />
      </SettingsList.Group>
    </ListLayout>
  );
}

//#region Storage Summary
function StorageWidget() {
  const { t } = useTranslation();
  const { outline } = useTheme();
  const { data } = useStorageSummary();

  const getValue = (
    field: keyof ExtractQueryData<typeof useStorageSummary>,
  ) => {
    return data ? abbreviateSize(data[field]) : "—";
  };

  return (
    <SegmentedList.CustomItem className="gap-4 p-4">
      <ProgressBar
        entries={[
          { color: Colors.red, value: data?.images ?? 0 },
          { color: Colors.yellow, value: data?.database ?? 0 },
          { color: Colors.green, value: data?.fonts ?? 0 },
          { color: Colors.blue, value: data?.other ?? 0 },
          { color: outline, value: data?.cache ?? 0 },
        ]}
        total={data?.total ?? 0}
      />
      <View className="gap-2">
        <LegendItem
          label={t("feat.insights.extra.images")}
          value={getValue("images")}
          color={Colors.red}
        />
        <LegendItem
          label={t("feat.insights.extra.database")}
          value={getValue("database")}
          color={Colors.yellow}
        />
        <LegendItem
          label={t("feat.font.title")}
          value={getValue("fonts")}
          color={Colors.green}
        />
        <LegendItem
          label={t("feat.insights.extra.other")}
          value={getValue("other")}
          color={Colors.blue}
        />
        <LegendItem
          label={t("feat.insights.extra.cache")}
          value={getValue("cache")}
          color={outline}
        />
      </View>
      <LegendItem
        label={t("feat.insights.extra.total")}
        value={getValue("total")}
      />
    </SegmentedList.CustomItem>
  );
}

async function getStorageSummary() {
  const dbSize = getDirectorySize(new Directory(Paths.document, "SQLite"));
  const imgSize = getDirectorySize(new Directory(ImageDirectory));
  const fontSize = getDirectorySize(new Directory(FontDirectory));
  const otherSize = getDirectorySize(new Directory(Paths.document));
  const cacheSize = getDirectorySize(new Directory(Paths.cache));

  return {
    images: imgSize,
    database: dbSize,
    fonts: fontSize,
    other: otherSize - imgSize - dbSize - fontSize,
    cache: cacheSize,
    total: otherSize + cacheSize,
  };
}

const storageSummaryQueryKey = ["insights", "storage-summary"];

function useStorageSummary() {
  return useQuery({
    queryKey: storageSummaryQueryKey,
    queryFn: getStorageSummary,
    staleTime: 0,
  });
}
//#endregion

//#region DB Summary
function DBSummaryWidget() {
  const { t } = useTranslation();
  const { data } = useDatabaseSummary();

  const getValue = (
    field: keyof ExtractQueryData<typeof useDatabaseSummary>,
  ) => {
    if (!data) return "—";
    if (field === "totalDuration") return Seconds.toReadableTime(data[field]);
    return data[field];
  };

  return (
    <SegmentedList.CustomItem className="gap-4 p-4">
      <View className="gap-2">
        <LegendItem label={t("term.albums")} value={getValue("albums")} />
        <LegendItem label={t("term.artists")} value={getValue("artists")} />
        <LegendItem label={t("term.genres")} value={getValue("genres")} />
        <LegendItem
          label={t("feat.insights.extra.images")}
          value={getValue("images")}
        />
        <LegendItem label={t("term.playlists")} value={getValue("playlists")} />
        <LegendItem label={t("term.tracks")} value={getValue("tracks")} />
      </View>
      <View className="gap-2">
        <LegendItem
          label={t("feat.hiddenTracks.title")}
          value={getValue("hiddenTracks")}
        />
        <LegendItem
          label={t("feat.saveErrors.title")}
          value={getValue("saveErrors")}
        />
      </View>
      <LegendItem
        label={t("feat.insights.extra.totalDuration")}
        value={getValue("totalDuration")}
      />
    </SegmentedList.CustomItem>
  );
}

async function getDatabaseSummary() {
  const imgDir = new Directory(ImageDirectory);
  return {
    albums: await db.$count(albums),
    artists: await db.$count(artists),
    genres: await db.$count(genres),
    images: imgDir.exists ? (imgDir.info().files?.length ?? 0) : 0,
    playlists: await db.$count(playlists),
    tracks: await db.$count(tracks),
    hiddenTracks: await db.$count(hiddenTracks),
    saveErrors: await db.$count(invalidTracks),
    totalDuration:
      Number(
        (await db.select({ total: sum(tracks.duration) }).from(tracks))[0]
          ?.total,
      ) || 0,
  };
}

const dbSummaryQueryKey = ["insights", "db-summary"];

function useDatabaseSummary() {
  return useQuery({
    queryKey: dbSummaryQueryKey,
    queryFn: getDatabaseSummary,
    staleTime: 0,
  });
}
//#endregion

//#region Database Optimization
function DatabaseOptimizationWidget() {
  const { t } = useTranslation();
  const { data } = useOptimizableTargetCount();
  const optimizeDB = useOptimizeDatabase();

  const count = data ?? 0;

  return (
    <SettingsList.Item
      icon="delete"
      label={t("feat.dbOptimization.title")}
      supporting={t("feat.dbOptimization.brief", { count })}
      onPress={() => mutateGuard(optimizeDB, undefined)}
      disabled={count === 0 || optimizeDB.isPending}
    />
  );
}
//#endregion

//#region Internal Utils
function getDirectorySize(dir: Directory): number {
  if (!dir.exists) return 0;
  return dir.info().size ?? 0;
}
//#endregion
