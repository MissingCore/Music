import { useQuery } from "@tanstack/react-query";
import { sum } from "drizzle-orm";
import {
  cacheDirectory,
  documentDirectory,
  getInfoAsync,
  readDirectoryAsync,
} from "expo-file-system";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { db } from "@/db";
import { albums, artists, playlists, tracks, invalidTracks } from "@/db/schema";
import { settingKeys } from "@/constants/QueryKeys";

import { useTheme } from "@/hooks/useTheme";
import { SettingsLayout } from "@/layouts/SettingsLayout";

import { Colors } from "@/constants/Styles";
import { abbreviateSize, formatSeconds } from "@/utils/number";
import { Card } from "@/components/new/Card";
import { Legend, LegendItem, ProgressBar } from "@/components/new/Form";
import { List, ListItem } from "@/components/new/List";

/** Screen for `/setting/insights` route. */
export default function InsightsScreen() {
  const { t } = useTranslation();

  return (
    <SettingsLayout>
      <List>
        <StorageWidget />
        <DBSummaryWidget />
      </List>

      <ListItem
        title={t("header.saveErrors")}
        description={t("settings.brief.saveErrors")}
        onPress={() => router.navigate("/setting/insights/save-errors")}
        {...{ first: true, last: true }}
      />
    </SettingsLayout>
  );
}

/** Breaks down what this app stores on the device. */
function StorageWidget() {
  const { t } = useTranslation();
  const { foreground } = useTheme();
  const { isPending, error, data } = useStorageStats();

  if (isPending || error) return null;

  return (
    <Card className="gap-2 rounded-b-sm">
      <ProgressBar
        entries={[
          { color: Colors.red, value: data.images },
          { color: Colors.yellow, value: data.database },
          { color: "#4142BE", value: data.other },
          { color: `${foreground}40`, value: data.cache },
        ]}
        total={data.total}
      />
      <Legend className="py-2">
        <LegendItem
          name={t("settings.related.images")}
          value={abbreviateSize(data.images)}
          color={Colors.red}
        />
        <LegendItem
          name={t("settings.related.database")}
          value={abbreviateSize(data.database)}
          color={Colors.yellow}
        />
        <LegendItem
          name={t("settings.related.other")}
          value={abbreviateSize(data.other)}
          color="#4142BE"
        />
        <LegendItem
          name={t("settings.related.cache")}
          value={abbreviateSize(data.cache)}
          color={`${foreground}40`} // 25% Opacity
        />
      </Legend>
      <LegendItem
        name={t("settings.related.total")}
        value={abbreviateSize(data.total)}
      />
    </Card>
  );
}

/** Summarizes what is stored in the database. */
function DBSummaryWidget() {
  const { t } = useTranslation();
  const { isPending, error, data } = useDBSummary();

  if (isPending || error) return null;

  return (
    <Card className="gap-2 rounded-t-sm">
      <Legend className="pb-2">
        <LegendItem name={t("common.albums")} value={data.albums} />
        <LegendItem name={t("common.artists")} value={data.artists} />
        <LegendItem name={t("settings.related.images")} value={data.images} />
        <LegendItem name={t("common.playlists")} value={data.playlists} />
        <LegendItem name={t("common.tracks")} value={data.tracks} />
        <LegendItem name={t("header.saveErrors")} value={data.saveErrors} />
      </Legend>
      <LegendItem
        name={t("settings.related.totalDuration")}
        value={formatSeconds(data.totalDuration, {
          format: "duration",
          omitSeconds: true,
        })}
      />
    </Card>
  );
}

//#region Data
async function getStorageStats() {
  if (!documentDirectory) throw new Error("Web not supported");

  const dbData = await getInfoAsync(documentDirectory + "SQLite");
  const imgData = await getInfoAsync(documentDirectory + "images");
  const otherData = await getInfoAsync(documentDirectory);
  const cacheData = await getInfoAsync(`${cacheDirectory}`);

  const dbSize = dbData.exists ? dbData.size : 0;
  const imgSize = imgData.exists ? imgData.size : 0;
  const otherSize = otherData.exists ? otherData.size : 0;
  const cacheSize = cacheData.exists ? cacheData.size : 0;

  return {
    images: imgSize,
    database: dbSize,
    other: otherSize - imgSize - dbSize,
    cache: cacheSize,
    total: otherSize + cacheSize,
  };
}

async function getDBSummary() {
  if (!documentDirectory) throw new Error("Web not supported");

  const imgDir = documentDirectory + "images";
  const imgData = await getInfoAsync(imgDir);
  let imgCount = imgData.exists ? (await readDirectoryAsync(imgDir)).length : 0;

  return {
    albums: await db.$count(albums),
    artists: await db.$count(artists),
    images: imgCount,
    playlists: await db.$count(playlists),
    tracks: await db.$count(tracks),
    saveErrors: await db.$count(invalidTracks),
    totalDuration:
      Number(
        (await db.select({ total: sum(tracks.duration) }).from(tracks))[0]
          ?.total,
      ) || 0,
  };
}

const useStorageStats = () =>
  useQuery({
    queryKey: settingKeys.storageRelation("storage-stats"),
    queryFn: getStorageStats,
    gcTime: 0,
  });

const useDBSummary = () =>
  useQuery({
    queryKey: settingKeys.storageRelation("db-summary"),
    queryFn: getDBSummary,
    gcTime: 0,
  });
//#endregion
