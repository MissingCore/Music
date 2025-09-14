import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useDatabaseSummary, useStorageSummary } from "~/queries/setting";
import { useTheme } from "~/hooks/useTheme";
import { router } from "../../utils/router";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { Colors } from "~/constants/Styles";
import type { ExtractQueryData } from "~/lib/react-query";
import { abbreviateSize, formatSeconds } from "~/utils/number";
import { Card } from "~/components/Containment/Card";
import { List, ListItem } from "~/components/Containment/List";
import { Legend, LegendItem } from "~/components/Form/Legend";
import { ProgressBar } from "~/components/Form/ProgressBar";

export default function Insights() {
  const { t } = useTranslation();
  return (
    <StandardScrollLayout>
      <List>
        <StorageWidget />
        <DBSummaryWidget />
      </List>

      <List>
        <ListItem
          titleKey="feat.hiddenTracks.title"
          description={t("feat.hiddenTracks.brief")}
          onPress={() => router.navigate("/setting/insights/hidden")}
          first
        />
        <ListItem
          titleKey="feat.saveErrors.title"
          description={t("feat.saveErrors.brief")}
          onPress={() => router.navigate("/setting/insights/save-errors")}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}

/** Breaks down what this app stores on the device. */
function StorageWidget() {
  const { foreground } = useTheme();
  const { data } = useStorageSummary();

  const getValue = useCallback(
    (field: keyof ExtractQueryData<typeof useStorageSummary>) =>
      data ? abbreviateSize(data[field]) : "—",
    [data],
  );

  return (
    <Card className="gap-4 rounded-b-sm">
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

/** Summarizes what is stored in the database. */
function DBSummaryWidget() {
  const { data } = useDatabaseSummary();

  const getValue = useCallback(
    (field: keyof ExtractQueryData<typeof useDatabaseSummary>) => {
      if (!data) return "—";
      if (field === "totalDuration") return formatSeconds(data[field], false);
      return data[field];
    },
    [data],
  );

  return (
    <Card className="gap-4 rounded-t-sm">
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
