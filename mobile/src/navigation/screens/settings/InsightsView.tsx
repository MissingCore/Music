import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { sum } from "drizzle-orm";
import { Directory, Paths } from "expo-file-system";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { albums, artists, invalidTracks, playlists, tracks } from "~/db/schema";

import { useTheme } from "~/hooks/useTheme";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { Colors } from "~/constants/Styles";
import { ImageDirectory } from "~/lib/file-system";
import type { ExtractQueryData } from "~/lib/react-query";
import { abbreviateSize, formatSeconds } from "~/utils/number";
import { Card } from "~/components/Containment/Card";
import { List, ListItem } from "~/components/Containment/List";
import { Legend, LegendItem } from "~/components/Form/Legend";
import { ProgressBar } from "~/components/Form/ProgressBar";

export default function Insights() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <StandardScrollLayout>
      <List>
        <StorageWidget />
        <DBSummaryWidget />
      </List>

      <ListItem
        titleKey="feat.mostPlayed.title"
        description={t("feat.mostPlayed.brief")}
        onPress={() => navigation.navigate("MostPlayed")}
        first
        last
      />

      <List>
        <ListItem
          titleKey="feat.hiddenTracks.title"
          description={t("feat.hiddenTracks.brief")}
          onPress={() => navigation.navigate("HiddenTracks")}
          first
        />
        <ListItem
          titleKey="feat.saveErrors.title"
          description={t("feat.saveErrors.brief")}
          onPress={() => navigation.navigate("SaveErrors")}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}

//#region Storage Summary
function StorageWidget() {
  const { foreground } = useTheme();
  const { data } = useStorageSummary();

  const getValue = (
    field: keyof ExtractQueryData<typeof useStorageSummary>,
  ) => {
    return data ? abbreviateSize(data[field]) : "—";
  };

  return (
    <Card className="gap-4 rounded-b-xs">
      <ProgressBar
        entries={[
          { color: Colors.red, value: data?.images ?? 0 },
          { color: Colors.yellow, value: data?.database ?? 0 },
          { color: "#4142BE", value: data?.other ?? 0 },
          { color: `${foreground}40`, value: data?.cache ?? 0 },
        ]}
        total={data?.total ?? 0}
      />
      <Legend>
        <LegendItem
          nameKey="feat.insights.extra.images"
          value={getValue("images")}
          color={Colors.red}
        />
        <LegendItem
          nameKey="feat.insights.extra.database"
          value={getValue("database")}
          color={Colors.yellow}
        />
        <LegendItem
          nameKey="feat.insights.extra.other"
          value={getValue("other")}
          color="#4142BE"
        />
        <LegendItem
          nameKey="feat.insights.extra.cache"
          value={getValue("cache")}
          color={`${foreground}40`} // 25% Opacity
        />
      </Legend>
      <LegendItem
        nameKey="feat.insights.extra.total"
        value={getValue("total")}
      />
    </Card>
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
    <Card className="gap-4 rounded-t-xs">
      <Legend>
        <LegendItem nameKey="term.albums" value={getValue("albums")} />
        <LegendItem nameKey="term.artists" value={getValue("artists")} />
        <LegendItem
          nameKey="feat.insights.extra.images"
          value={getValue("images")}
        />
        <LegendItem nameKey="term.playlists" value={getValue("playlists")} />
        <LegendItem nameKey="term.tracks" value={getValue("tracks")} />
      </Legend>
      <Legend>
        <LegendItem
          nameKey="feat.hiddenTracks.title"
          value={getValue("hiddenTracks")}
        />
        <LegendItem
          nameKey="feat.saveErrors.title"
          value={getValue("saveErrors")}
        />
      </Legend>
      <LegendItem
        nameKey="feat.insights.extra.totalDuration"
        value={getValue("totalDuration")}
      />
    </Card>
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
    hiddenTracks: (
      await db.query.tracks.findMany({
        where: (fields, { isNotNull }) => isNotNull(fields.hiddenAt),
        columns: { id: true },
      })
    ).length,
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
