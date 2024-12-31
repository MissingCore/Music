import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { useDatabaseSummary, useStorageSummary } from "@/queries/setting";
import { useTheme } from "@/hooks/useTheme";
import { StandardScrollLayout } from "@/layouts/StandardScroll";

import { Colors } from "@/constants/Styles";
import { abbreviateSize, formatSeconds } from "@/utils/number";
import { Card, List, ListItem } from "@/components/Containment";
import { Legend, LegendItem, ProgressBar } from "@/components/Form";

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
        titleKey="header.saveErrors"
        description={t("settings.brief.saveErrors")}
        onPress={() => router.navigate("/setting/insights/save-errors")}
        {...{ first: true, last: true }}
      />
    </StandardScrollLayout>
  );
}

/** Breaks down what this app stores on the device. */
function StorageWidget() {
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
          nameKey="settings.related.images"
          value={abbreviateSize(data.images)}
          color={Colors.red}
        />
        <LegendItem
          nameKey="settings.related.database"
          value={abbreviateSize(data.database)}
          color={Colors.yellow}
        />
        <LegendItem
          nameKey="settings.related.other"
          value={abbreviateSize(data.other)}
          color="#4142BE"
        />
        <LegendItem
          nameKey="settings.related.cache"
          value={abbreviateSize(data.cache)}
          color={`${foreground}40`} // 25% Opacity
        />
      </Legend>
      <LegendItem
        nameKey="settings.related.total"
        value={abbreviateSize(data.total)}
      />
    </Card>
  );
}

/** Summarizes what is stored in the database. */
function DBSummaryWidget() {
  const { isPending, error, data } = useDatabaseSummary();
  if (isPending || error) return null;
  return (
    <Card className="gap-2 rounded-t-sm">
      <Legend className="pb-2">
        <LegendItem nameKey="common.albums" value={data.albums} />
        <LegendItem nameKey="common.artists" value={data.artists} />
        <LegendItem nameKey="settings.related.images" value={data.images} />
        <LegendItem nameKey="common.playlists" value={data.playlists} />
        <LegendItem nameKey="common.tracks" value={data.tracks} />
        <LegendItem nameKey="header.saveErrors" value={data.saveErrors} />
      </Legend>
      <LegendItem
        nameKey="settings.related.totalDuration"
        value={formatSeconds(data.totalDuration, {
          format: "duration",
          omitSeconds: true,
        })}
      />
    </Card>
  );
}
