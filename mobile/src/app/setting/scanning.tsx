import { useTranslation } from "react-i18next";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useRescanForTracks } from "@/modules/scanning/helpers/rescan";
import { StandardScrollLayout } from "@/layouts";
import { MinDurationModal, ScanFilterListModal } from "@/screens/Modals";

import { mutateGuard } from "@/lib/react-query";
import { List, ListItem } from "@/components/new/Containment";
import { useModalRef } from "@/components/new/Modal";

/** Screen for `/setting/scanning` route. */
export default function ScanningScreen() {
  const { t } = useTranslation();
  const allowList = useUserPreferencesStore((state) => state.listAllow);
  const blockList = useUserPreferencesStore((state) => state.listBlock);
  const ignoreDuration = useUserPreferencesStore((state) => state.minSeconds);
  const rescan = useRescanForTracks();

  const allowListModalRef = useModalRef();
  const blockListModalRef = useModalRef();
  const minDurationModalRef = useModalRef();

  return (
    <>
      <StandardScrollLayout>
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
            onPress={() => minDurationModalRef.current?.present()}
            last
          />
        </List>
      </StandardScrollLayout>

      <ScanFilterListModal ref={allowListModalRef} listType="listAllow" />
      <ScanFilterListModal ref={blockListModalRef} listType="listBlock" />
      <MinDurationModal ref={minDurationModalRef} />
    </>
  );
}
