// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { bundleId } from "@missingcore/native-utils";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import * as SettingsList from "./components/SettingsList";

import { APP_VERSION } from "~/constants/Config";
import { Links } from "~/lib/web-browser";
import { Card } from "~/components/next/base/card";
import { Text } from "~/components/next/base/typography";
import { Image } from "~/components/next/primitive/image";

export default function AboutApp() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const checkForUpdates = usePreferenceStore((s) => s.checkForUpdates);
  const showRCNotification = usePreferenceStore((s) => s.rcNotification);

  return (
    <ListLayout>
      <Card className="items-center gap-4 p-6">
        <Image
          source={require("~/resources/images/app-icon.png")}
          className="size-24 rounded-full"
        />
        <View className="gap-1">
          <Text accent center>
            MissingCore Music
          </Text>
          <Text muted center>
            {bundleId}
          </Text>
        </View>
      </Card>

      <SettingsList.Group>
        <SettingsList.ExternalLinkItem
          icon="update"
          label={t("feat.appUpdate.extra.viewChangelog")}
          supporting={APP_VERSION}
          href={Links.CurrentRelease}
        />
        <SettingsList.Divider />
        <SettingsList.ToggleItem
          icon="release-alert"
          label={t("feat.appUpdate.extra.checkUpdates")}
          onToggle={PreferenceTogglers.toggleKey("checkForUpdates")}
          enabled={checkForUpdates}
        />
        <SettingsList.Divider />
        <SettingsList.ToggleItem
          icon="flask-filled"
          label={t("feat.appUpdate.extra.rcNotification")}
          onToggle={PreferenceTogglers.toggleKey("rcNotification")}
          enabled={showRCNotification}
          disabled={!checkForUpdates}
        />
      </SettingsList.Group>

      <SettingsList.Group>
        <SettingsList.ExternalLinkItem
          icon="translate"
          label={t("feat.language.extra.contribute")}
          href={Links.Translations}
        />
        <SettingsList.Divider />
        <SettingsList.ExternalLinkItem
          icon="logo-github"
          label={t("feat.code.title")}
          supporting={t("feat.code.brief")}
          href={Links.GitHub}
        />
      </SettingsList.Group>

      <SettingsList.Group>
        <SettingsList.ExternalLinkItem
          icon="lock"
          label={t("feat.privacy.title")}
          href={Links.PrivacyPolicy}
        />
        <SettingsList.Divider />
        <SettingsList.ExternalLinkItem
          icon="license"
          label={t("feat.license.title")}
          supporting="AGPL-3.0"
          href={Links.License}
        />
        <SettingsList.Divider />
        <SettingsList.Item
          icon="license"
          label={t("feat.thirdParty.title")}
          supporting={t("feat.thirdParty.brief")}
          onPress={() => navigation.navigate("ThirdParty")}
        />
      </SettingsList.Group>
    </ListLayout>
  );
}
