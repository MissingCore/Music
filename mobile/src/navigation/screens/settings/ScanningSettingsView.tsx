import { useTranslation } from "react-i18next";

import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useRescanForTracks } from "~/modules/scanning/helpers/rescan";
import { StandardScrollLayout } from "../../layouts/StandardScroll";
import { ScanningSettingsSheets } from "./ScanningSettingsSheets";

import { mutateGuard } from "~/lib/react-query";
import { List, ListItem } from "~/components/Containment/List";
import { useSheetRef } from "~/components/Sheet";

export default function ScanningSettings() {
  const { t } = useTranslation();
  const allowList = useUserPreferencesStore((state) => state.listAllow);
  const blockList = useUserPreferencesStore((state) => state.listBlock);
  const ignoreDuration = useUserPreferencesStore((state) => state.minSeconds);
  const rescan = useRescanForTracks();
  const allowListSheetRef = useSheetRef();
  const blockListSheetRef = useSheetRef();
  const minDurationSheetRef = useSheetRef();

  return (
    <>
      <ScanningSettingsSheets
        allowListRef={allowListSheetRef}
        blockListRef={blockListSheetRef}
        minDurationRef={minDurationSheetRef}
      />
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
            onPress={() => allowListSheetRef.current?.present()}
            first
          />
          <ListItem
            titleKey="feat.listBlock.title"
            description={t("plural.entry", { count: blockList.length })}
            onPress={() => blockListSheetRef.current?.present()}
          />
          <ListItem
            titleKey="feat.ignoreDuration.title"
            description={t("plural.second", { count: ignoreDuration })}
            onPress={() => minDurationSheetRef.current?.present()}
            last
          />
        </List>
      </StandardScrollLayout>
    </>
  );
}
