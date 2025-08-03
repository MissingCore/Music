import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { TopAppBar } from "~/components/TopAppBar";

export default function CurrentLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ animation: "fade", header: TopAppBar }}>
      <Stack.Screen name="playlist/Favorite Tracks" options={{ title: "" }} />
      <Stack.Screen name="playlist/create" options={{ title: "" }} />
      <Stack.Screen name="playlist/modify" options={{ title: "" }} />
      <Stack.Screen name="playlist/[id]" options={{ title: "" }} />
      <Stack.Screen name="album/[id]" options={{ title: "" }} />
      <Stack.Screen name="artist/[id]" options={{ title: "" }} />
      <Stack.Screen
        name="recently-played"
        options={{ title: t("feat.playedRecent.title") }}
      />
      <Stack.Screen name="track/modify" options={{ title: "" }} />
    </Stack>
  );
}
