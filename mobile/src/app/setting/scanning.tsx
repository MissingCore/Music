import { useTranslation } from "react-i18next";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useRescanForTracks } from "@/modules/scanning/helpers/rescan";
import { SettingsLayout } from "@/layouts/SettingsLayout";

import { mutateGuard } from "@/lib/react-query";
import { List, ListItem } from "@/components/new/List";
import { useModalRef } from "@/components/new/Modal";

/** Screen for `/setting/scanning` route. */
export default function ScanningScreen() {
  const { t } = useTranslation();
  const allowList = useUserPreferencesStore((state) => state.listAllow);
  const blockList = useUserPreferencesStore((state) => state.listBlock);
  const ignoreDuration = useUserPreferencesStore((state) => state.minSeconds);
  const rescan = useRescanForTracks();

  return (
    <>
      <SettingsLayout>
        <ListItem
          title={t("settings.rescan")}
          description={t("settings.brief.rescan")}
          disabled={rescan.isPending}
          onPress={() => mutateGuard(rescan, undefined)}
          {...{ first: true, last: true }}
        />

        <List>
          <ListItem
            title={t("title.listAllow")}
            description={t("plural.entry", { count: allowList.length })}
            onPress={() => allowListModalRef.current?.present()}
            first
          />
          <ListItem
            title={t("title.listBlock")}
            description={t("plural.entry", { count: blockList.length })}
            onPress={() => blockListModalRef.current?.present()}
          />
          <ListItem
            title={t("title.ignoreDuration")}
            description={t("plural.second", { count: ignoreDuration })}
            onPress={() => console.log("Viewing ignore duration modal...")}
            last
          />
        </List>
      </SettingsLayout>
    </>
  );
}
