// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";

import { LocalMediaAdapter } from "~/_next/adapters/local-media";
import { q } from "~/_next/data/key-store";

import { PlaybackControls } from "~/stores/Playback/actions";
import { usePlayFromSource } from "~/_next/context/play-from-context";
import { ThemeProvider, useTheme } from "~/_next/context/theme-context";
import { useLayoutColumn } from "~/_next/hooks/use-column";
import { useDimmedImageColor } from "~/_next/hooks/use-dimmed-image-color";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { GoBack } from "~/_next/navigation/components/go-back";

import { getImageUri } from "~/lib/file-system";
import { Seconds } from "~/_next/utils/date";
import { Image } from "~/_next/components/primitives/image";
import { LegendList } from "~/_next/components/primitives/legend-list";
import { ChipButton } from "~/_next/components/button-chip";
import { IconButton } from "~/_next/components/button-icon";
import { Divider } from "~/_next/components/divider";
import { TransitionGradient } from "~/_next/components/gradient";
import { Icon } from "~/_next/components/icon";
import { ImageCard } from "~/_next/components/image-card";
import { ImageListItem } from "~/_next/components/image-list-item";
import { Marquee } from "~/_next/components/marquee";
import { Text } from "~/_next/components/typography";

function useArtist(id: string) {
  return useQuery({
    queryKey: q.artist.detail(id),
    queryFn: () => LocalMediaAdapter.artist.get(id),
    select: ({ artwork, ...rest }) => ({
      ...rest,
      artwork: getImageUri(artwork),
    }),
  });
}

type Props = StaticScreenProps<{ id: string }>;

export default function Artist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, error, data } = useArtist(id);
  const backgroundColor = useDimmedImageColor(data?.artwork);
  const source = usePlayFromSource();

  const bottomOffset = useBottomActionsOffset();

  const albumColCnt = useLayoutColumn("grid").count;
  const trackColCnt = useLayoutColumn("list").count;
  const totalColumns = trackColCnt * albumColCnt;

  const ScreenTheme = useMemo(
    () =>
      ({
        background: backgroundColor,
        text: "#FFFFFF",
      }) as const,
    [backgroundColor],
  );

  if (isPending) return <Text>Loading...</Text>;
  if (error) return <GoBack />;
  return (
    <ThemeProvider colors={ScreenTheme}>
      <LegendList
        numColumns={totalColumns}
        getItemType={(item: React.JSX.Element) => {
          if (item?.type === Label) return "label";
          if (item?.type === ImageCard) return "album-item";
          else if (item?.type === ImageListItem) return "track-item";
        }}
        overrideItemLayout={(layout, item: React.JSX.Element) => {
          if (item?.type === ImageCard) layout.span = trackColCnt;
          else if (item?.type === ImageListItem) layout.span = albumColCnt;
          else if (item) layout.span = totalColumns;
        }}
        ListHeaderComponent={
          <ScreenHeader
            name={data.name}
            artwork={data.artwork}
            metadata={t("plural.track", { count: data.numTracks })}
            duration={data.totalDuration}
          />
        }
        style={{ backgroundColor }}
        contentContainerClassName="gap-1.5 px-4"
        contentContainerStyle={{ paddingBottom: bottomOffset }}
      >
        {data.discography.albums.length > 0 ? (
          <Label label={t("term.albums")} />
        ) : null}
        {data.discography.albums.map((item) => (
          <ImageCard
            key={item.id}
            artwork={item.artwork}
            label={item.name}
            supporting={item.year}
            onPress={() => navigation.navigate("Album", { id: item.id })}
          />
        ))}

        {data.discography.eps.length > 0 ? (
          <Label label={t("term.eps")} />
        ) : null}
        {data.discography.eps.map((item) => (
          <ImageCard
            key={item.id}
            artwork={item.artwork}
            label={item.name}
            supporting={item.year}
            onPress={() => navigation.navigate("Album", { id: item.id })}
          />
        ))}

        {data.discography.singles.length > 0 ? (
          <Label label={t("term.singles")} />
        ) : null}
        {data.discography.singles.map((item) => (
          <ImageListItem
            key={item.id}
            artwork={item.artwork}
            label={item.name}
            supporting={item.album ?? "—"}
            onPress={() =>
              PlaybackControls.playFromList({ source, trackId: item.id })
            }
          />
        ))}

        {data.related.albums.length > 0 || data.related.genres.length > 0 ? (
          <Divider className="mt-4" />
        ) : null}

        {data.related.albums.length > 0 ? (
          <Label label={t("term.appearsIn")} />
        ) : null}
        {data.related.albums.map((item) => (
          <ImageCard
            key={item.id}
            artwork={item.artwork}
            label={item.name}
            supporting={item.year}
            onPress={() => navigation.navigate("Album", { id: item.id })}
          />
        ))}

        {data.related.genres.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap gap-1.5">
            {data.related.genres.map((genre) => (
              <ChipButton
                key={genre}
                label={genre}
                onPress={() => navigation.navigate("Genre", { id: genre })}
              />
            ))}
          </View>
        ) : null}
      </LegendList>
    </ThemeProvider>
  );
}

function ScreenHeader(props: {
  name: string;
  artwork: string | null;
  metadata: string;
  duration: number;
}) {
  const { t } = useTranslation();
  const dimensions = useWindowDimensions();
  const { text } = useTheme();
  const source = usePlayFromSource();

  const headerHeight = Math.min(400, dimensions.height, dimensions.width);

  return (
    <View
      style={{ height: headerHeight }}
      //? We should be conditionally switching between `-mx-4` & `-mx-5.5` based
      //? on `numColumns`, but it realistically will be >1 (unless the user has
      //? a really small/weird screen).
      className="relative -mx-5.5 items-center justify-end overflow-hidden"
    >
      <Image
        source={props.artwork}
        contentPosition="top"
        className="absolute inset-0"
      />
      <TransitionGradient
        style={{ height: headerHeight * 0.6 }}
        className="absolute inset-x-0 bottom-0"
      />
      <View className="w-full p-4">
        <Marquee center>
          <Text bold size="4xl">
            {props.name}
          </Text>
        </Marquee>
        <Marquee center contentContainerClassName="flex-row items-center">
          <Text color="textMuted">{props.metadata}</Text>
          {/* Work around for RTL languages. */}
          <Text color="textMuted">{" • "}</Text>
          <Icon name="time" color="textMuted" size={20} />
          <Text color="textMuted">{` ${Seconds.toReadableTime(props.duration, true)}`}</Text>
        </Marquee>

        <View className="mt-4 flex-row items-center justify-center">
          <IconButton
            accessibilityLabel={t("term.play")}
            icon="play-filled"
            onPress={() => PlaybackControls.playFromList({ source })}
            iconColor="background"
            color="text"
            className="h-14 w-full max-w-36"
            style={{ backgroundColor: text }}
          />
        </View>
      </View>
    </View>
  );
}

function Label({ label }: { label: string }) {
  return (
    <Marquee wrapperClassName="pt-1.5">
      <Text bold size="xl">
        {label}
      </Text>
    </Marquee>
  );
}
