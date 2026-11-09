// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useEffect, useState } from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";

import { usePlaybackStore } from "~/stores/Playback/store";
import { useLyricStore } from "../core/store";
import type { LyricProvider } from "../core/constants";
import { searchLyricsWithProvider } from "../helpers/autoDiscoverLyrics";
import type { SheetRef } from "~/components/next/base/sheet";
import { ScrollableSheet, SheetHeader } from "~/components/next/base/sheet";
import { Card } from "~/components/next/base/card";
import { Text, TText } from "~/components/next/base/typography";
import { Pressable } from "~/components/next/primitive/pressable";
import { Colors } from "~/constants/Styles";

type ProviderStatus = "idle" | "success" | "error";

const StatusStyles: Record<ProviderStatus, ViewStyle> = {
  idle: { borderWidth: 2, borderColor: "transparent" },
  success: {
    borderWidth: 2,
    borderColor: Colors.green,
    backgroundColor: `${Colors.green}22`,
  },
  error: {
    borderWidth: 2,
    borderColor: Colors.red,
    backgroundColor: `${Colors.red}22`,
  },
};

export function LyricProvidersSheet(props: { ref: SheetRef }) {
  const providers = useLyricStore((s) => s.providers);
  const activeTrackId = usePlaybackStore((s) => s.activeTrack?.id);
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus>>({});

  // Reset the feedback colors whenever the active track changes.
  useEffect(() => {
    setStatuses({});
  }, [activeTrackId]);

  const handleProviderPress = useCallback(async (provider: LyricProvider) => {
    const found = await searchLyricsWithProvider(provider);
    setStatuses((prev) => ({
      ...prev,
      [provider.id]: found ? "success" : "error",
    }));
  }, []);

  return (
    <ScrollableSheet
      ref={props.ref}
      draggable
      onCleanup={() => setStatuses({})}
      header={
        <SheetHeader>
          <TText
            textKey="feat.lyrics.extra.providers"
            bold
            center
            className="pb-5"
          />
        </SheetHeader>
      }
    >
      {providers.length === 0 ? (
        <TText
          textKey="feat.lyrics.extra.noProviders"
          muted
          center
          className="py-8"
        />
      ) : (
        <View className="gap-3">
          {providers.map((provider) => {
            const status = statuses[provider.id] ?? "idle";
            return (
              <Pressable
                key={provider.id}
                onPress={() => void handleProviderPress(provider)}
              >
                <Card
                  className="rounded-full px-6 py-4"
                  style={StatusStyles[status]}
                >
                  <Text bold size="base" numberOfLines={1}>
                    {provider.name}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollableSheet>
  );
}