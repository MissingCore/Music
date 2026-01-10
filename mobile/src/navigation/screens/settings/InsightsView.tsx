import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { sum } from "drizzle-orm";
import { Directory, Paths } from "expo-file-system";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import {
  albums,
  artists,
  hiddenTracks,
  invalidTracks,
  playlists,
  tracks,
} from "~/db/schema";

import { useTheme } from "~/hooks/useTheme";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { Colors } from "~/constants/Styles";
import { ImageDirectory } from "~/lib/file-system";
import type { ExtractQueryData } from "~/lib/react-query";
import { abbreviateSize, formatSeconds } from "~/utils/number";
import { SegmentedList } from "~/components/List/Segmented";
import { Legend } from "~/components/UI/Legend";
import { ProgressBar } from "~/components/UI/ProgressBar";

export default function Insights() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <StandardScrollLayout>
      <SegmentedList>
        <StorageWidget />
        <DBSummaryWidget />
      </SegmentedList>

      <SegmentedList.Item
        labelTextKey="feat.mostPlayed.title"
        supportingText={t("feat.mostPlayed.brief")}
        onPress={() => navigation.navigate("MostPlayed")}
      />

      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.hiddenTracks.title"
          supportingText={t("feat.hiddenTracks.brief")}
          onPress={() => navigation.navigate("HiddenTracks")}
        />
        <SegmentedList.Item
          labelTextKey="feat.saveErrors.title"
          supportingText={t("feat.saveErrors.brief")}
          onPress={() => navigation.navigate("SaveErrors")}
        />
      </SegmentedList>
    </StandardScrollLayout>
  );
}

//#region Storage Summary
function StorageWidget() {
  const { outlineVariant } = useTheme();
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
          { color: Colors.blue, value: data?.other ?? 0 },
          { color: outlineVariant, value: data?.cache ?? 0 },
        ]}
        total={data?.total ?? 0}
      />
      <Legend>
        <Legend.Item
          labelTextKey="feat.insights.extra.images"
          value={getValue("images")}
          color={Colors.red}
        />
        <Legend.Item
          labelTextKey="feat.insights.extra.database"
          value={getValue("database")}
          color={Colors.yellow}
        />
        <Legend.Item
          labelTextKey="feat.insights.extra.other"
          value={getValue("other")}
          color={Colors.blue}
        />
        <Legend.Item
          labelTextKey="feat.insights.extra.cache"
          value={getValue("cache")}
          color={outlineVariant}
        />
      </Legend>
      <Legend.Item
        labelTextKey="feat.insights.extra.total"
        value={getValue("total")}
      />
    </SegmentedList.CustomItem>
  );
}

async function getStorageSummary() {
  const dbSize = getDirectorySize(new Directory(Paths.document, "SQLite"));
  const imgSize = getDirectorySize(new Directory(ImageDirectory));
  const otherSize = getDirectorySize(new Directory(Paths.document));
  const cacheSize = getDirectorySize(new Directory(Paths.cache));

  return {
    images: imgSize,
    database: dbSize,
    other: otherSize - imgSize - dbSize,
    cache: cacheSize,
    total: otherSize + cacheSize,
  };
}

const storageSummaryQueryKey = ["settings", "storage-summary"];

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
  const { data } = useDatabaseSummary();

  const getValue = (
    field: keyof ExtractQueryData<typeof useDatabaseSummary>,
  ) => {
    if (!data) return "—";
    if (field === "totalDuration") return formatSeconds(data[field], false);
    return data[field];
  };

  return (
    <SegmentedList.CustomItem className="gap-4 p-4">
      <Legend>
        <Legend.Item labelTextKey="term.albums" value={getValue("albums")} />
        <Legend.Item labelTextKey="term.artists" value={getValue("artists")} />
        <Legend.Item
          labelTextKey="feat.insights.extra.images"
          value={getValue("images")}
        />
        <Legend.Item
          labelTextKey="term.playlists"
          value={getValue("playlists")}
        />
        <Legend.Item labelTextKey="term.tracks" value={getValue("tracks")} />
      </Legend>
      <Legend>
        <Legend.Item
          labelTextKey="feat.hiddenTracks.title"
          value={getValue("hiddenTracks")}
        />
        <Legend.Item
          labelTextKey="feat.saveErrors.title"
          value={getValue("saveErrors")}
        />
      </Legend>
      <Legend.Item
        labelTextKey="feat.insights.extra.totalDuration"
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

const dbSummaryQueryKey = ["settings", "db-summary"];

function useDatabaseSummary() {
  return useQuery({
    queryKey: dbSummaryQueryKey,
    queryFn: getDatabaseSummary,
    staleTime: 0,
  });
}
//#endregion

//#region Internal Utils
function getDirectorySize(dir: Directory): number {
  if (!dir.exists) return 0;
  return dir.info().size ?? 0;
}
//#endregion
