import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useRescanForTracks } from "@/modules/scanning/helpers/rescan";
import { StandardScrollLayout } from "@/layouts";

import { mutateGuard } from "@/lib/react-query";
import { List, ListItem } from "@/components/Containment";

/** Screen for `/setting/scanning` route. */
export default function ScanningScreen() {
  const { t } = useTranslation();
  const allowList = useUserPreferencesStore((state) => state.listAllow);
  const blockList = useUserPreferencesStore((state) => state.listBlock);
  const ignoreDuration = useUserPreferencesStore((state) => state.minSeconds);
  const rescan = useRescanForTracks();

  return (
    <StandardScrollLayout>
      <ListItem
        titleKey="settings.rescan"
        description={t("settings.brief.rescan")}
        disabled={rescan.isPending}
        onPress={() => mutateGuard(rescan, undefined)}
        {...{ first: true, last: true }}
      />

      <List>
        <ListItem
          titleKey="title.listAllow"
          description={t("plural.entry", { count: allowList.length })}
          onPress={() =>
            SheetManager.show("ScanFilterListSheet", {
              payload: { listType: "listAllow" },
            })
          }
          first
        />
        <ListItem
          titleKey="title.listBlock"
          description={t("plural.entry", { count: blockList.length })}
          onPress={() =>
            SheetManager.show("ScanFilterListSheet", {
              payload: { listType: "listBlock" },
            })
          }
        />
        <ListItem
          titleKey="title.ignoreDuration"
          description={t("plural.second", { count: ignoreDuration })}
          onPress={() => SheetManager.show("MinDurationSheet")}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}
