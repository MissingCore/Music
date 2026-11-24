// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, useWindowDimensions } from "react-native";

import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import { usePlayFromSource } from "~/_next/context/play-from-context";
import { useSearchStore } from "~/_next/context/search-context";
import { useTheme } from "~/_next/context/theme-context";

import { getImageUri } from "~/lib/file-system";
import { Seconds } from "~/_next/utils/date";
import { OnRTL } from "~/_next/utils/i18n";
import { cn } from "~/_next/utils/style";
import { Image } from "~/_next/components/primitives/image";
import { BlurContainer } from "~/_next/components/blur-container";
import type { BlurIconButtonProps } from "~/_next/components/button-icon";
import { BlurIconButton, IconButton } from "~/_next/components/button-icon";
import { TransitionGradient } from "~/_next/components/gradient";
import { Icon } from "~/_next/components/icon";
import { ImageCard, ImageListItem } from "~/_next/components/image-item";
import { TextInput } from "~/_next/components/input";
import { Marquee } from "~/_next/components/marquee";
import { Menu } from "~/_next/components/menu";
import { Ripple } from "~/_next/components/ripple";
import { Text, TText } from "~/_next/components/typography";

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
        <BlurIconButton
          icon={OnRTL.decide("arrow-right", "arrow-left")}
          accessibilityLabel={t("form.back")}
          onPress={() => navigation.goBack()}
        />
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
    <View className="relative min-w-10 flex-1 items-end">
      <BlurContainer
        className={cn(
          "h-10 max-w-[min(512px,100%)] min-w-10",
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
        className="absolute top-0 right-0"
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
        source={getImageUri(props.artwork)}
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

//#region Actions
type ActionSlot = [React.JSX.Element] | [React.JSX.Element, React.JSX.Element];

/** Actions displayed in `MediaListLayout.Header`. */
export function ActionBar(props: {
  playable?: boolean;
  LeftActions?: ActionSlot;
  RightActions?: ActionSlot;
}) {
  const { t } = useTranslation();
  const { text } = useTheme().colors;
  const source = usePlayFromSource();

  return (
    <View className="mt-4 w-full flex-row items-center justify-center gap-2">
      <View className="size-full max-w-26 shrink-0 flex-row items-center justify-end gap-2">
        {props.LeftActions}
      </View>
      <IconButton
        accessibilityLabel={t("term.play")}
        icon="play-filled"
        onPress={() => PlaybackControls.playFromList({ source })}
        disabled={!(props.playable ?? true)}
        iconColor="background"
        color="text"
        className="h-14 max-w-36 shrink grow disabled:opacity-50"
        style={{ backgroundColor: text }}
      />
      <View className="size-full max-w-26 shrink-0 flex-row items-center justify-start gap-2">
        {props.RightActions}
      </View>
    </View>
  );
}

/** Pre-styled button for actions in `MediaListLayout.ActionBar`. */
export function Action({ className, ...props }: BlurIconButtonProps) {
  return <BlurIconButton {...props} className={cn(className, "size-12")} />;
}

/** Opens menu to select whether list should be played next or at the end of the current queue. */
export function AddToQueueAction(props: {
  name: string;
  trackIds: string[];
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      anchor={
        <Action
          icon="list-check"
          accessibilityLabel={t("feat.queue.extra.add")}
          onPress={() => setVisible((prev) => !prev)}
          disabled={props.disabled}
        />
      }
      dismissHandling
      onDismiss={() => setVisible(false)}
    >
      <Ripple
        onPress={() => {
          Queue.add({ id: props.trackIds, name: props.name });
          setVisible(false);
        }}
        color="text"
        className="w-full flex-row items-center gap-3 px-3 py-2"
      >
        <Icon name="list-start" size={20} />
        <TText textKey="feat.queue.extra.playNext" />
      </Ripple>
      <Ripple
        onPress={() => {
          Queue.addToEnd({ id: props.trackIds, name: props.name });
          setVisible(false);
        }}
        color="text"
        className="w-full flex-row items-center gap-3 px-3 py-2"
      >
        <Icon name="list-end" size={20} />
        <TText textKey="feat.queue.extra.playLast" />
      </Ripple>
    </Menu>
  );
}

/** Pre-styled component for triggering an "edit" action. */
export function EditAction(props: { onPress: VoidFunction }) {
  const { t } = useTranslation();
  return (
    <Action
      icon="pencil"
      accessibilityLabel={t("form.edit")}
      onPress={props.onPress}
    />
  );
}
//#endregion
//#endregion

//#region Lazy Renderer
export function Label({ label }: { label: string }) {
  return (
    <Marquee wrapperClassName="py-1.5">
      <Text bold size="xl">
        {label}
      </Text>
    </Marquee>
  );
}

export function renderLabel(label: string, data: readonly unknown[]) {
  return data.length > 0 ? <Label label={label} /> : null;
}

/** Helper to map data into render `<ImageCard />` in a lazy LegendList. */
export function renderCardFactory<TData extends Record<string, any>>(args: {
  getKey: (item: TData) => string;
  getProps: (item: TData) => React.ComponentProps<typeof ImageCard>;
}) {
  return function RenderCard(item: TData) {
    return <ImageCard key={args.getKey(item)} {...args.getProps(item)} />;
  };
}

/** Helper to map data into render `<ImageListItem />` in a lazy LegendList. */
export function renderItemFactory<TData extends Record<string, any>>(args: {
  getKey: (item: TData) => string;
  getProps: (item: TData) => React.ComponentProps<typeof ImageListItem>;
}) {
  return function RenderItem(item: TData) {
    return <ImageListItem key={args.getKey(item)} {...args.getProps(item)} />;
  };
}
//#endregion
