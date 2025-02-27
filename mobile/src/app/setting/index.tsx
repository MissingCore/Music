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
          titleKey="feat.appUpdate.title"
          description={t("feat.appUpdate.brief")}
          onPress={() => router.navigate("/setting/update")}
          className="rounded-full bg-yellow"
          textColor="text-neutral0"
        />
      )}

      <List>
        <ListItem
          titleKey="feat.appearance.title"
          description={t("feat.appearance.brief")}
          onPress={() => router.navigate("/setting/appearance")}
          first
        />
        <ListItem
          titleKey="feat.language.title"
          description={currLang ?? "English"}
          onPress={() => SheetManager.show("LanguageSheet")}
          last
        />
      </List>

      <List>
        <ListItem
          titleKey="feat.backup.title"
          description={t("feat.backup.brief")}
          onPress={() => SheetManager.show("BackupSheet")}
          first
        />
        <ListItem
          titleKey="feat.insights.title"
          description={t("feat.insights.brief")}
          onPress={() => router.navigate("/setting/insights")}
        />
        <ListItem
          titleKey="feat.interactions.title"
          description={t("feat.interactions.brief")}
          icon={<OpenInNew />}
          onPress={() =>
            WebBrowser.openBrowserAsync(LINKS.NOTHING_INTERACTIONS)
          }
        />
        <ListItem
          titleKey="feat.playback.title"
          description={t("feat.playback.brief")}
          onPress={() => router.navigate("/setting/playback")}
        />
        <ListItem
          titleKey="feat.scanning.title"
          description={t("feat.scanning.brief")}
          onPress={() => router.navigate("/setting/scanning")}
          last
        />
      </List>

      <List>
        <ListItem
          titleKey="feat.translate.title"
          description={t("feat.translate.brief")}
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.TRANSLATIONS)}
          first
        />
        <ListItem
          titleKey="feat.code.title"
          description={t("feat.code.brief")}
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.GITHUB)}
        />
        <ListItem
          titleKey="feat.license.title"
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.LICENSE)}
        />
        <ListItem
          titleKey="feat.privacy.title"
          icon={<OpenInNew />}
          onPress={() => WebBrowser.openBrowserAsync(LINKS.PRIVACY_POLICY)}
        />
        <ListItem
          titleKey="feat.thirdParty.title"
          description={t("feat.thirdParty.brief")}
          onPress={() => router.navigate("/setting/third-party")}
        />
        <ListItem
          titleKey="feat.version.title"
          description={APP_VERSION}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}
