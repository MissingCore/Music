// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { bundleId } from "@missingcore/native-utils";
import { useNavigation } from "@react-navigation/native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";
import { ListLayout } from "~/navigation/layouts/ListLayout";

import { APP_VERSION } from "~/constants/Config";
import { Links, openLink } from "~/lib/web-browser";
import { Switch } from "~/components/Form/Switch";
import { Card } from "~/components/next/base/card";
import { Image } from "~/components/next/base/image";
import { createTextStack } from "~/components/next/blocks/text-stack";
import * as SettingsList from "./components/SettingsList";

const CustomTextStack = createTextStack({
  labelConfig: { intent: "accent", center: true },
  descriptionConfig: { muted: true, center: true },
});

export default function AboutApp() {
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  const checkForUpdates = usePreferenceStore((s) => s.checkForUpdates);
  const showRCNotification = usePreferenceStore((s) => s.rcNotification);

  return (
    <ListLayout>
      <Card className="items-center gap-4 p-6">
        <Image
          source={require("~/resources/images/app-icon.png")}
          className="size-24 rounded-full"
        />
        <CustomTextStack
          // @ts-expect-error - Will render text if translation key isn't found.
          label="MissingCore Music"
          descriptionText={bundleId}
        />

        <SettingsList.Container theme={hasNewUpdate ? "secondary" : "muted"}>
          <SettingsList.Item
            iconName={hasNewUpdate ? "mobile-arrow-down" : "mobile-check"}
            contentConfig={{
              label: `feat.appUpdate.${hasNewUpdate ? "brief" : "extra.upToDate"}`,
            }}
            onPress={() => navigation.navigate("AppUpdate")}
            disabled={!hasNewUpdate}
            Trailing={hasNewUpdate && <SettingsList.FunctionIndicator />}
          />
        </SettingsList.Container>
      </Card>

      <SettingsList.Container>
        <SettingsList.Item
          iconName="update"
          contentConfig={{
            label: "feat.appUpdate.extra.viewChangelog",
            descriptionText: APP_VERSION,
          }}
          onPress={() => openLink(Links.CurrentRelease)}
          Trailing={<SettingsList.FunctionIndicator intent="external" />}
        />
        <SettingsList.Divider />
        <SettingsList.Item
          iconName="release-alert"
          contentConfig={{ label: "feat.appUpdate.extra.checkUpdates" }}
          onPress={PreferenceTogglers.toggleKey("checkForUpdates")}
          Trailing={<Switch enabled={checkForUpdates} />}
        />
        <SettingsList.Divider />
        <SettingsList.Item
          iconName="flask-filled"
          contentConfig={{ label: "feat.appUpdate.extra.rcNotification" }}
          onPress={PreferenceTogglers.toggleKey("rcNotification")}
          disabled={!checkForUpdates}
          className="disabled:opacity-25"
          Trailing={<Switch enabled={showRCNotification} />}
        />
      </SettingsList.Container>

      <SettingsList.Container>
        <SettingsList.Item
          iconName="translate"
          contentConfig={{ label: "feat.language.extra.contribute" }}
          onPress={() => openLink(Links.Translations)}
          Trailing={<SettingsList.FunctionIndicator intent="external" />}
        />
        <SettingsList.Divider />
        <SettingsList.Item
          iconName="logo-github"
          contentConfig={{
            label: "feat.code.title",
            description: "feat.code.brief",
          }}
          onPress={() => openLink(Links.GitHub)}
          Trailing={<SettingsList.FunctionIndicator intent="external" />}
        />
      </SettingsList.Container>

      <SettingsList.Container>
        <SettingsList.Item
          iconName="lock"
          contentConfig={{ label: "feat.privacy.title" }}
          onPress={() => openLink(Links.PrivacyPolicy)}
          Trailing={<SettingsList.FunctionIndicator intent="external" />}
        />
        <SettingsList.Divider />
        <SettingsList.Item
          iconName="license"
          contentConfig={{
            label: "feat.license.title",
            descriptionText: "AGPL-3.0",
          }}
          onPress={() => openLink(Links.License)}
          Trailing={<SettingsList.FunctionIndicator intent="external" />}
        />
        <SettingsList.Divider />
        <SettingsList.Item
          iconName="license"
          contentConfig={{
            label: "feat.thirdParty.title",
            description: "feat.thirdParty.brief",
          }}
          onPress={() => navigation.navigate("ThirdParty")}
          Trailing={<SettingsList.FunctionIndicator />}
        />
      </SettingsList.Container>
    </ListLayout>
  );
}
