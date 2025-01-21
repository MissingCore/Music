import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { TopAppBar } from "@/components/TopAppBar";

export default function SettingsLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ animation: "fade", header: TopAppBar }}>
      <Stack.Screen name="index" options={{ title: t("header.settings") }} />
      <Stack.Screen name="update" options={{ title: t("header.appUpdate") }} />
      <Stack.Screen
        name="appearance/index"
        options={{ title: t("header.appearance") }}
      />
      <Stack.Screen
        name="appearance/home-tabs-order"
        options={{ title: t("title.homeTabsOrder") }}
      />
      <Stack.Screen
        name="insights/index"
        options={{ title: t("header.insights") }}
      />
      <Stack.Screen
        name="insights/save-errors"
        options={{ title: t("header.saveErrors") }}
      />
      <Stack.Screen name="scanning" options={{ title: t("header.scanning") }} />
      <Stack.Screen
        name="third-party/index"
        options={{ title: t("header.thirdParty") }}
      />
      <Stack.Screen name="third-party/[id]" options={{ title: "" }} />
    </Stack>
  );
}
