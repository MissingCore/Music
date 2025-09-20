import { useNavigation } from "@react-navigation/native";
import { openBrowserAsync } from "expo-web-browser";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "~/resources/icons/OpenInNew";
import { queries as q } from "~/queries/keyStore";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { useHasNewUpdate } from "~/hooks/useHasNewUpdate";
import { StandardScrollLayout } from "../../layouts/StandardScroll";
import { SettingsSheets } from "~/screens/Sheets/Settings/Root";

import { APP_VERSION } from "~/constants/Config";
import * as LINKS from "~/constants/Links";
import { queryClient } from "~/lib/react-query";
import { Card } from "~/components/Containment/Card";
import { List, ListItem } from "~/components/Containment/List";
import { Divider } from "~/components/Divider";
import { useSheetRef } from "~/components/Sheet";
import { LANGUAGES } from "~/modules/i18n/constants";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  const showRCNotification = useUserPreferencesStore(
    (state) => state.rcNotification,
  );
  const backupSheetRef = useSheetRef();
  const languageSheetRef = useSheetRef();

  const currLang = LANGUAGES.find(({ code }) => code === i18n.language)?.name;

  return (
    <>
      <SettingsSheets
        backupRef={backupSheetRef}
        languageRef={languageSheetRef}
      />
      <StandardScrollLayout>
        {hasNewUpdate && (
          <ListItem
            titleKey="feat.appUpdate.title"
            description={t("feat.appUpdate.brief")}
            onPress={() => navigation.navigate("AppUpdate")}
            className="rounded-full bg-yellow"
            textColor="text-neutral0"
          />
        )}

        <List>
          <ListItem
            titleKey="feat.appearance.title"
            description={t("feat.appearance.brief")}
            onPress={() => navigation.navigate("AppearanceSettings")}
            first
          />
          <ListItem
            titleKey="feat.language.title"
            description={currLang ?? "English"}
            onPress={() => languageSheetRef.current?.present()}
            last
          />
        </List>

        <List>
          <ListItem
            titleKey="feat.backup.title"
            description={t("feat.backup.brief")}
            onPress={() => backupSheetRef.current?.present()}
            first
          />
          <ListItem
            titleKey="feat.insights.title"
            description={t("feat.insights.brief")}
            onPress={() => navigation.navigate("Insights")}
          />
          {/* <ListItem
            titleKey="feat.interactions.title"
            description={t("feat.interactions.brief")}
            icon={<OpenInNew />}
            onPress={() => openBrowserAsync(LINKS.NOTHING_INTERACTIONS)}
          /> */}
          <ListItem
            titleKey="feat.playback.title"
            description={t("feat.playback.brief")}
            onPress={() => navigation.navigate("PlaybackSettings")}
          />
          <ListItem
            titleKey="feat.scanning.title"
            description={t("feat.scanning.brief")}
            onPress={() => navigation.navigate("ScanningSettings")}
            last
          />
        </List>

        <ListItem
          titleKey="feat.experimental.title"
          description={t("feat.experimental.brief")}
          onPress={() => navigation.navigate("ExperimentalSettings")}
          first
          last
        />

        <List>
          <ListItem
            titleKey="feat.translate.title"
            description={t("feat.translate.brief")}
            icon={<OpenInNew />}
            onPress={() => openBrowserAsync(LINKS.TRANSLATIONS)}
            first
          />
          <ListItem
            titleKey="feat.code.title"
            description={t("feat.code.brief")}
            icon={<OpenInNew />}
            onPress={() => openBrowserAsync(LINKS.GITHUB)}
          />
          <ListItem
            titleKey="feat.license.title"
            icon={<OpenInNew />}
            onPress={() => openBrowserAsync(LINKS.LICENSE)}
          />
          <ListItem
            titleKey="feat.privacy.title"
            icon={<OpenInNew />}
            onPress={() => openBrowserAsync(LINKS.PRIVACY_POLICY)}
          />
          <ListItem
            titleKey="feat.thirdParty.title"
            description={t("feat.thirdParty.brief")}
            onPress={() => navigation.navigate("ThirdParty")}
          />
          <Card className="overflow-hidden rounded-t-sm p-0">
            <ListItem
              titleKey="feat.version.title"
              description={APP_VERSION}
              icon={<OpenInNew />}
              onPress={() => openBrowserAsync(LINKS.VERSION_CHANGELOG)}
              className="rounded-none"
            />
            <Divider className="mx-4" />
            <ListItem
              titleKey="feat.version.extra.rcNotification"
              onPress={toggleRCNotification}
              switchState={showRCNotification}
              className="rounded-none"
            />
          </Card>
        </List>
      </StandardScrollLayout>
    </>
  );
}

const toggleRCNotification = () => {
  userPreferencesStore.setState((prev) => ({
    rcNotification: !prev.rcNotification,
  }));
  queryClient.invalidateQueries({ queryKey: q.settings.releaseNote.queryKey });
};
