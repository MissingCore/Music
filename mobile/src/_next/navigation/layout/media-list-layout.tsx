// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, useWindowDimensions } from "react-native";

import { PlaybackControls } from "~/stores/Playback/actions";
import { usePlayFromSource } from "~/_next/context/play-from-context";
import { useSearchStore } from "~/_next/context/search-context";
import { useTheme } from "~/_next/context/theme-context";

import { Seconds } from "~/_next/utils/date";
import { OnRTL } from "~/_next/utils/i18n";
import { cn } from "~/_next/utils/style";
import { Image } from "~/_next/components/primitives/image";
import { IconButton } from "~/_next/components/button-icon";
import { BlurContainer } from "~/_next/components/blur-container";
import { TransitionGradient } from "~/_next/components/gradient";
import { Icon } from "~/_next/components/icon";
import { TextInput } from "~/_next/components/input";
import { Marquee } from "~/_next/components/marquee";
import { Text } from "~/_next/components/typography";

//#region App Bar
/**
 * Top app bar built for adaptive layouts listing out lots of data.
 *
 * Optionally supports search via nearest `<SearchProvider />`.
 */
export function AppBar({ searchEnabled = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <View className="absolute inset-x-0 z-100 pt-safe">
      <View className="h-14 w-full flex-row items-center gap-4 px-2">
        <BlurContainer>
          <IconButton
            icon={OnRTL.decide("arrow-right", "arrow-left")}
            accessibilityLabel={t("form.back")}
            onPress={() => navigation.goBack()}
            color="text"
          />
        </BlurContainer>
        {searchEnabled ? <SearchBar /> : null}
      </View>
    </View>
  );
}

function SearchBar() {
  const { t } = useTranslation();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const setQuery = useSearchStore((s) => s.setQuery);

  return (
    <View className="relative min-w-10.5 flex-1 items-end">
      <BlurContainer
        className={cn(
          "h-10.5 max-w-[min(512px,100%)] min-w-10.5",
          searchEnabled && "w-full pr-10 pl-2",
        )}
      >
        {searchEnabled ? (
          <TextInput
            autoFocus
            placeholder={t("feat.search.extra.searchMedia")}
            //? Doesn't need to be controlled as it's only changed here.
            onChangeText={setQuery}
            className="size-full"
            style={{ textAlignVertical: "center" }}
          />
        ) : null}
      </BlurContainer>
      <IconButton
        icon={searchEnabled ? "close" : "search"}
        accessibilityLabel={t(
          searchEnabled ? "form.close" : "feat.search.title",
        )}
        onPress={() => {
          setSearchEnabled((prev) => !prev);
          if (searchEnabled) setQuery("");
        }}
        color="text"
        //? Absolute-positioned as layout animation would have it slide-in
        //? with the text input.
        className="absolute top-px right-px"
      />
    </View>
  );
}
//#endregion

//#region Header
/** Expressive header for content displayed on screen. */
export function Header(props: {
  title: string;
  artwork: string | null;
  Description: React.JSX.Element;
  Actions: React.JSX.Element;
}) {
  const dimensions = useWindowDimensions();
  return (
    <View
      style={{ height: Math.min(400, dimensions.height, dimensions.width) }}
      className="relative -mx-5.5 items-center justify-end overflow-hidden"
    >
      <Image
        source={props.artwork}
        contentPosition="top"
        className="absolute inset-0"
      />
      <TransitionGradient
        easing
        className="absolute inset-x-0 bottom-0 h-3/5"
      />
      <View className="w-full p-4">
        <Marquee center>
          <Text bold size="4xl">
            {props.title}
          </Text>
        </Marquee>
        {props.Description}
        {props.Actions}
      </View>
    </View>
  );
}

/** Some statistics about the media being displayed. */
export function Metadata(props: { stats: string; duration: number }) {
  return (
    <Marquee center contentContainerClassName="flex-row items-center">
      <Text color="textMuted">{props.stats}</Text>
      {/* Work around for RTL languages. */}
      <Text color="textMuted">{" • "}</Text>
      <Icon name="time" color="textMuted" size={20} />
      <Text color="textMuted">{` ${Seconds.toReadableTime(props.duration, true)} `}</Text>
    </Marquee>
  );
}

/** Actions displayed in `MediaListLayout.Header`. */
export function ActionBar(props: { playable: boolean }) {
  const { t } = useTranslation();
  const { text } = useTheme().colors;
  const source = usePlayFromSource();

  return (
    <View className="mt-4 w-full flex-row items-center justify-center">
      <IconButton
        accessibilityLabel={t("term.play")}
        icon="play-filled"
        onPress={() => PlaybackControls.playFromList({ source })}
        disabled={!props.playable}
        iconColor="background"
        color="text"
        className="h-14 w-full max-w-36 disabled:opacity-50"
        style={{ backgroundColor: text }}
      />
    </View>
  );
}
//#endregion
