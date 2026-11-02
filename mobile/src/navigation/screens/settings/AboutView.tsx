// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { bundleId } from "@missingcore/native-utils";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ScrollLayout } from "~/navigation/layouts/ScrollLayout";

import { APP_VERSION } from "~/constants/Config";
import { Links } from "~/lib/web-browser";
import { Card } from "~/components/next/base/card";
import { createTextStack } from "~/components/next/blocks/text-stack";
import * as List from "~/components/next/composed/list";
import { Image } from "~/components/next/primitive/image";

const CTATextStack = createTextStack({
  labelConfig: { accent: true, center: true },
  supportingConfig: { muted: true, center: true },
  containerClassName: "gap-1.5",
});

export default function AboutApp() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const checkForUpdates = usePreferenceStore((s) => s.checkForUpdates);
  const showRCNotification = usePreferenceStore((s) => s.rcNotification);

  return (
    <ScrollLayout title="term.about">
      <Card className="items-center gap-4 p-6">
        <Image
          source={require("~/resources/images/app-icon.png")}
          className="size-24 rounded-full"
        />
        <CTATextStack label="MissingCore Music" supporting={bundleId} />
      </Card>

      <List.Group>
        <List.ExternalLinkItem
          icon="update"
          label={t("feat.appUpdate.extra.viewChangelog")}
          supporting={APP_VERSION}
          href={Links.CurrentRelease}
        />
        <List.Divider />
        <List.ToggleItem
          icon="release-alert"
          label={t("feat.appUpdate.extra.checkUpdates")}
          onToggle={PreferenceTogglers.toggleKey("checkForUpdates")}
          enabled={checkForUpdates}
        />
        <List.Divider />
        <List.ToggleItem
          icon="flask-filled"
          label={t("feat.appUpdate.extra.rcNotification")}
          onToggle={PreferenceTogglers.toggleKey("rcNotification")}
          enabled={showRCNotification}
          disabled={!checkForUpdates}
        />
      </List.Group>

      <List.Group>
        <List.ExternalLinkItem
          icon="translate"
          label={t("feat.language.extra.contribute")}
          href={Links.Translations}
        />
        <List.Divider />
        <List.ExternalLinkItem
          icon="logo-github"
          label={t("feat.code.title")}
          supporting={t("feat.code.brief")}
          href={Links.GitHub}
        />
      </List.Group>

      <List.Group>
        <List.ExternalLinkItem
          icon="lock"
          label={t("feat.privacy.title")}
          href={Links.PrivacyPolicy}
        />
        <List.Divider />
        <List.ExternalLinkItem
          icon="license"
          label={t("feat.license.title")}
          supporting="AGPL-3.0"
          href={Links.License}
        />
        <List.Divider />
        <List.Item
          icon="license"
          label={t("feat.thirdParty.title")}
          supporting={t("feat.thirdParty.brief")}
          onPress={() => navigation.navigate("ThirdParty")}
        />
      </List.Group>
    </ScrollLayout>
  );
}
