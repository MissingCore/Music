import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { OpenInNew } from "@/icons";
import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";
import { StandardScrollLayout } from "@/layouts";
import { LANGUAGES } from "@/modules/i18n/constants";

import { APP_VERSION } from "@/constants/Config";
import * as LINKS from "@/constants/Links";
import { List, ListItem } from "@/components/Containment";

/** Screen for `/setting` route. */
export default function SettingScreen() {
  const { t, i18n } = useTranslation();
  const { hasNewUpdate } = useHasNewUpdate();

  const currLang = LANGUAGES.find(({ code }) => code === i18n.language)!.name;

  return (
    <StandardScrollLayout>
      {hasNewUpdate && (
        <ListItem
          title={t("header.appUpdate")}
          description={t("settings.brief.appUpdate")}
          onPress={() => router.navigate("/setting/update")}
          className="rounded-full bg-yellow"
          textColor="text-neutral0"
        />
      )}

      <List>
        <ListItem
          title={t("header.appearance")}
          description={t("settings.brief.appearance")}
          onPress={() => router.navigate("/setting/appearance")}
          first
        />
        <ListItem
          title={t("title.language")}
          description={currLang}
          onPress={() => SheetManager.show("LanguageSheet")}
          last
        />
      </List>

      <List>
        <ListItem
          title={t("title.backup")}
          description={t("settings.brief.backup")}
          onPress={() => SheetManager.show("BackupSheet")}
          first
        />
        <ListItem
          title={t("header.insights")}
          description={t("settings.brief.insights")}
          onPress={() => router.navigate("/setting/insights")}
        />
        <ListItem
          title={t("settings.interactions")}
          description={t("settings.brief.interactions")}
          icon={<OpenInNew />}
          onPress={() =>
            WebBrowser.openBrowserAsync(LINKS.NOTHING_INTERACTIONS)
          }
        />
        <ListItem
          title={t("header.scanning")}
          description={t("settings.brief.scanning")}
          onPress={() => router.navigate("/setting/scanning")}
          last
        />
      </List>

      <List>
        <ListItem
          title={t("settings.translate")}
          description={t("settings.brief.translate")}
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.TRANSLATIONS)}
          first
        />
        <ListItem
          title={t("settings.code")}
          description={t("settings.brief.code")}
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.GITHUB)}
        />
        <ListItem
          title={t("settings.license")}
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.LICENSE)}
        />
        <ListItem
          title={t("settings.privacy")}
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.PRIVACY_POLICY)}
        />
        <ListItem
          title={t("header.thirdParty")}
          description={t("settings.brief.thirdParty")}
          onPress={() => router.navigate("/setting/third-party")}
        />
        <ListItem
          title={t("settings.version")}
          description={APP_VERSION}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}
