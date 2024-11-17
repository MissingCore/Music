import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { useDatabaseSummary, useStorageSummary } from "@/queries/setting";
import { useTheme } from "@/hooks/useTheme";
import { StandardScrollLayout } from "@/layouts";

import { Colors } from "@/constants/Styles";
import { abbreviateSize, formatSeconds } from "@/utils/number";
import { Card, List, ListItem } from "@/components/new/Containment";
import { Legend, LegendItem, ProgressBar } from "@/components/new/Form";

/** Screen for `/setting/insights` route. */
export default function InsightsScreen() {
  const { t } = useTranslation();
  return (
    <StandardScrollLayout>
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
    </StandardScrollLayout>
  );
}

/** Breaks down what this app stores on the device. */
function StorageWidget() {
  const { t } = useTranslation();
  const { foreground } = useTheme();
  const { isPending, error, data } = useStorageSummary();

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
  const { isPending, error, data } = useDatabaseSummary();

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
