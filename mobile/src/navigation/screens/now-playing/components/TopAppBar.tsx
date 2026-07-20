// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";

import { getMediaLinkContext } from "~/navigation/utils/router";

import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { StyledText } from "~/components/Typography/StyledText";

/**
 * Header bar design for "Now Playing" screen which automatically displays
 * the list being played without setting the `title` prop.
 */
export function NowPlayingTopAppBar() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const playingSource = usePlaybackStore((s) => s.playingFrom);
  const listName = usePlaybackStore((s) => s.playingFromName);
  const usedDesign = usePreferenceStore((s) => s.nowPlayingDesign);

  const listLinkInfo = useMemo(
    () => (playingSource ? getMediaLinkContext(playingSource) : undefined),
    [playingSource],
  );

  if (usedDesign === "vinylOld") return null;
  return (
    <View className="z-100 -mb-8 h-14 flex-row items-center justify-between gap-4 px-2 py-1">
      <FilledIconButton
        icon="arrow-back"
        accessibilityLabel={t("form.back")}
        onPress={() => navigation.goBack()}
        className="rtl:rotate-180"
      />
      <Pressable
        onPress={() =>
          listLinkInfo ? navigation.popTo(...listLinkInfo) : undefined
        }
        disabled={listLinkInfo === undefined}
        className="shrink gap-0.5"
      >
        <Marquee center>
          <StyledText dim className="text-xxs/[1.125]">
            {t("term.playingFrom")}
          </StyledText>
        </Marquee>
        <Marquee center>
          <StyledText className="text-xs/[1.125]">{listName}</StyledText>
        </Marquee>
      </Pressable>
      <View className="size-10" />
    </View>
  );
}
