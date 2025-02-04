import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { OpenInNew } from "~/icons/OpenInNew";
import { useHasNewUpdate } from "~/hooks/useHasNewUpdate";
import { StandardScrollLayout } from "~/layouts/StandardScroll";
import { LANGUAGES } from "~/modules/i18n/constants";

import { APP_VERSION } from "~/constants/Config";
import * as LINKS from "~/constants/Links";
import { List, ListItem } from "~/components/Containment/List";

/** Screen for `/setting` route. */
export default function SettingScreen() {
  const { t, i18n } = useTranslation();
  const { hasNewUpdate } = useHasNewUpdate();

  const currLang = LANGUAGES.find(({ code }) => code === i18n.language)?.name;

  return (
    <StandardScrollLayout>
      {hasNewUpdate && (
        <ListItem
          titleKey="header.appUpdate"
          description={t("settings.brief.appUpdate")}
          onPress={() => router.navigate("/setting/update")}
          className="rounded-full bg-yellow"
          textColor="text-neutral0"
        />
      )}

      <List>
        <ListItem
          titleKey="header.appearance"
          description={t("settings.brief.appearance")}
          onPress={() => router.navigate("/setting/appearance")}
          first
        />
        <ListItem
          titleKey="title.language"
          description={currLang ?? "English"}
          onPress={() => SheetManager.show("LanguageSheet")}
          last
        />
      </List>

      <List>
        <ListItem
          titleKey="title.backup"
          description={t("settings.brief.backup")}
          onPress={() => SheetManager.show("BackupSheet")}
          first
        />
        <ListItem
          titleKey="header.insights"
          description={t("settings.brief.insights")}
          onPress={() => router.navigate("/setting/insights")}
        />
        <ListItem
          titleKey="settings.interactions"
          description={t("settings.brief.interactions")}
          icon={<OpenInNew />}
          onPress={() =>
            WebBrowser.openBrowserAsync(LINKS.NOTHING_INTERACTIONS)
          }
        />
        <ListItem
          titleKey="header.scanning"
          description={t("settings.brief.scanning")}
          onPress={() => router.navigate("/setting/scanning")}
          last
        />
      </List>

      <List>
        <ListItem
          titleKey="settings.translate"
          description={t("settings.brief.translate")}
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.TRANSLATIONS)}
          first
        />
        <ListItem
          titleKey="settings.code"
          description={t("settings.brief.code")}
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.GITHUB)}
        />
        <ListItem
          titleKey="settings.license"
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.LICENSE)}
        />
        <ListItem
          titleKey="settings.privacy"
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.PRIVACY_POLICY)}
        />
        <ListItem
          titleKey="header.thirdParty"
          description={t("settings.brief.thirdParty")}
          onPress={() => router.navigate("/setting/third-party")}
        />
        <ListItem titleKey="settings.version" description={APP_VERSION} last />
      </List>
    </StandardScrollLayout>
  );
}
