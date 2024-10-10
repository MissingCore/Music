import { useTranslation } from "react-i18next";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { SettingsLayout } from "@/layouts/SettingsLayout";
import { FontModal, ThemeModal } from "@/screens/Modals";

import { List, ListItem } from "@/components/new/List";
import { useModalRef } from "@/components/new/Modal";

/** Screen for `/setting/appearance` route. */
export default function AppearanceScreen() {
  const { t } = useTranslation();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  const theme = useUserPreferencesStore((state) => state.theme);

  const fontModalRef = useModalRef();
  const themeModalRef = useModalRef();

  return (
    <>
      <SettingsLayout>
        <List>
          <ListItem
            title={t("title.font")}
            description={accentFont}
            onPress={() => fontModalRef.current?.present()}
            first
          />
          <ListItem
            title={t("title.theme")}
            description={t(`settings.related.${theme}`)}
            onPress={() => themeModalRef.current?.present()}
            last
          />
        </List>
      </SettingsLayout>

      <FontModal ref={fontModalRef} />
      <ThemeModal ref={themeModalRef} />
    </>
  );
}
