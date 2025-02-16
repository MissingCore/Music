import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useRescanForTracks } from "~/modules/scanning/helpers/rescan";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { mutateGuard } from "~/lib/react-query";
import { List, ListItem } from "~/components/Containment/List";

/** Screen for `/setting/scanning` route. */
export default function ScanningScreen() {
  const { t } = useTranslation();
  const allowList = useUserPreferencesStore((state) => state.listAllow);
  const blockList = useUserPreferencesStore((state) => state.listBlock);
  const ignoreDuration = useUserPreferencesStore((state) => state.minSeconds);
  const rescan = useRescanForTracks();

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="feat.rescan.title"
          description={t("feat.rescan.brief")}
          disabled={rescan.isPending}
          onPress={() => mutateGuard(rescan, undefined)}
          first
        />
        <ListItem
          titleKey="feat.deepRescan.title"
          description={t("feat.deepRescan.brief")}
          disabled={rescan.isPending}
          onPress={() => mutateGuard(rescan, true)}
          last
        />
      </List>

      <List>
        <ListItem
          titleKey="feat.listAllow.title"
          description={t("plural.entry", { count: allowList.length })}
          onPress={() =>
            SheetManager.show("ScanFilterListSheet", {
              payload: { listType: "listAllow" },
            })
          }
          first
        />
        <ListItem
          titleKey="feat.listBlock.title"
          description={t("plural.entry", { count: blockList.length })}
          onPress={() =>
            SheetManager.show("ScanFilterListSheet", {
              payload: { listType: "listBlock" },
            })
          }
        />
        <ListItem
          titleKey="feat.ignoreDuration.title"
          description={t("plural.second", { count: ignoreDuration })}
          onPress={() => SheetManager.show("MinDurationSheet")}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}
