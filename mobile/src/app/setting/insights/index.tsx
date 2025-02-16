import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { useDatabaseSummary, useStorageSummary } from "~/queries/setting";
import { useTheme } from "~/hooks/useTheme";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { Colors } from "~/constants/Styles";
import { abbreviateSize, formatSeconds } from "~/utils/number";
import { Card } from "~/components/Containment/Card";
import { List, ListItem } from "~/components/Containment/List";
import { Legend, LegendItem } from "~/components/Form/Legend";
import { ProgressBar } from "~/components/Form/ProgressBar";

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
        titleKey="feat.saveErrors.title"
        description={t("feat.saveErrors.brief")}
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
          nameKey="feat.insights.extra.images"
          value={abbreviateSize(data.images)}
          color={Colors.red}
        />
        <LegendItem
          nameKey="feat.insights.extra.database"
          value={abbreviateSize(data.database)}
          color={Colors.yellow}
        />
        <LegendItem
          nameKey="feat.insights.extra.other"
          value={abbreviateSize(data.other)}
          color="#4142BE"
        />
        <LegendItem
          nameKey="feat.insights.extra.cache"
          value={abbreviateSize(data.cache)}
          color={`${foreground}40`} // 25% Opacity
        />
      </Legend>
      <LegendItem
        nameKey="feat.insights.extra.total"
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
        <LegendItem nameKey="term.albums" value={data.albums} />
        <LegendItem nameKey="term.artists" value={data.artists} />
        <LegendItem nameKey="feat.insights.extra.images" value={data.images} />
        <LegendItem nameKey="term.playlists" value={data.playlists} />
        <LegendItem nameKey="term.tracks" value={data.tracks} />
        <LegendItem nameKey="feat.saveErrors.title" value={data.saveErrors} />
      </Legend>
      <LegendItem
        nameKey="feat.insights.extra.totalDuration"
        value={formatSeconds(data.totalDuration, false)}
      />
    </Card>
  );
}
