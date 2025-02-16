import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { TopAppBar } from "~/components/TopAppBar";

export default function SettingsLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ animation: "fade", header: TopAppBar }}>
      <Stack.Screen name="index" options={{ title: t("term.settings") }} />
      <Stack.Screen
        name="update"
        options={{ title: t("feat.appUpdate.title") }}
      />
      <Stack.Screen
        name="appearance/index"
        options={{ title: t("feat.appearance.title") }}
      />
      <Stack.Screen
        name="appearance/home-tabs-order"
        options={{ title: t("feat.homeTabsOrder.title") }}
      />
      <Stack.Screen
        name="insights/index"
        options={{ title: t("feat.insights.title") }}
      />
      <Stack.Screen
        name="insights/save-errors"
        options={{ title: t("feat.saveErrors.title") }}
      />
      <Stack.Screen
        name="scanning"
        options={{ title: t("feat.scanning.title") }}
      />
      <Stack.Screen
        name="third-party/index"
        options={{ title: t("feat.thirdParty.title") }}
      />
      <Stack.Screen name="third-party/[id]" options={{ title: "" }} />
    </Stack>
  );
}
