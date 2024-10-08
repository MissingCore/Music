import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { SettingsLayout } from "@/layouts/SettingsLayout";

import { mutateGuard } from "@/lib/react-query";
import { List, ListItem } from "@/components/new/List";
import { useModalRef } from "@/components/new/Modal";

/** Screen for `/setting/scanning` route. */
export default function ScanningScreen() {
  const { t } = useTranslation();
  const allowList = useUserPreferencesStore((state) => state.allowList);
  const blockList = useUserPreferencesStore((state) => state.blockList);
  const ignoreDuration = useUserPreferencesStore((state) => state.minSeconds);

  const rescan = useRescanLibrary();

  return (
    <>
      <SettingsLayout>
        <ListItem
          title={t("settings.rescan")}
          description={t("settings.brief.rescan")}
          onPress={() => mutateGuard(rescan, undefined)}
          {...{ first: true, last: true }}
        />

        <List>
          <ListItem
            title={t("title.listAllow")}
            description={t("plural.entry", { count: allowList.length })}
            onPress={() => console.log("Viewing allowlist modal...")}
            first
          />
          <ListItem
            title={t("title.listBlock")}
            description={t("plural.entry", { count: blockList.length })}
            onPress={() => console.log("Viewing blocklist modal...")}
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

//#region Data
async function rescanLibrary() {}

const useRescanLibrary = () => useMutation({ mutationFn: rescanLibrary });
//#endregion
