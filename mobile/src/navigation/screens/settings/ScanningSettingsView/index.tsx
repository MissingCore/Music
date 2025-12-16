import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { useRescanForTracks } from "~/modules/scanning/helpers/rescan";

import { StandardScrollLayout } from "~/navigation/layouts/StandardScroll";
import { MinDurationSheet } from "~/navigation/sheets/MinDurationSheet";
import { ScanningSettingsSheets } from "./Sheets";

import { mutateGuard } from "~/lib/react-query";
import { List, ListItem } from "~/components/Containment/List";
import { useSheetRef } from "~/components/Sheet";

export default function ScanningSettings() {
  const { t } = useTranslation();
  const rescanOnLaunch = usePreferenceStore((s) => s.rescanOnLaunch);
  const allowList = usePreferenceStore((s) => s.listAllow);
  const blockList = usePreferenceStore((s) => s.listBlock);
  const ignoreDuration = usePreferenceStore((s) => s.minSeconds);
  const rescan = useRescanForTracks();
  const allowListSheetRef = useSheetRef();
  const blockListSheetRef = useSheetRef();
  const minDurationSheetRef = useSheetRef();

  return (
    <>
      <MinDurationSheet ref={minDurationSheetRef} />
      <ScanningSettingsSheets
        allowListRef={allowListSheetRef}
        blockListRef={blockListSheetRef}
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

        <ListItem
          titleKey="feat.rescanOnLaunch.title"
          description={t("feat.rescanOnLaunch.brief")}
          onPress={PreferenceTogglers.toggleRescanOnLaunch}
          switchState={rescanOnLaunch}
          first
          last
        />

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
