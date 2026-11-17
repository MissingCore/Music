// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { use, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";

import { LocalMediaAdapter } from "~/_next/adapters/local-media";
import type { MediaItem } from "~/_next/adapters/types";
import { q } from "~/_next/data/key-store";

import { PlaybackControls } from "~/stores/Playback/actions";
import { PlayFromContext } from "~/_next/context/play-from-context";
import { ThemeProvider, useTheme } from "~/_next/context/theme-context";
import { useDimmedImageColor } from "~/_next/hooks/use-dimmed-image-color";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { GoBack } from "~/_next/navigation/components/go-back";

import { getImageUri } from "~/lib/file-system";
import { Seconds } from "~/_next/utils/date";
import { Image } from "~/_next/components/primitives/image";
import { LegendList } from "~/_next/components/primitives/legend-list";
import { IconButton } from "~/_next/components/button-icon";
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
  const dimensions = useWindowDimensions();
  const { isPending, error, data } = useArtist(id);
  const backgroundColor = useDimmedImageColor(data?.artwork);
  const source = use(PlayFromContext);

  const bottomOffset = useBottomActionsOffset();

  const estimatedColumns = Math.floor(dimensions.width / 300);

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
        numColumns={estimatedColumns}
        overrideItemLayout={(layout, item: React.JSX.Element) => {
          if (item?.type !== ImageListItem) layout.span = estimatedColumns;
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
        <RenderAlbumRow
          label={t("term.albums")}
          data={data.discography.albums}
        />
        <RenderAlbumRow label={t("term.eps")} data={data.discography.eps} />

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
  const dimensions = useWindowDimensions();
  const { text } = useTheme();
  const source = use(PlayFromContext);

  const headerHeight = Math.min(400, dimensions.height, dimensions.width);

  return (
    <View
      style={{ height: headerHeight }}
      className="relative -mx-4 items-center justify-end overflow-hidden"
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
    <Marquee>
      <Text bold size="lg">
        {label}
      </Text>
    </Marquee>
  );
}

function RenderAlbumRow(props: {
  label: string;
  data: MediaItem.DisplayAlbum[];
}) {
  const navigation = useNavigation();
  if (props.data.length === 0) return undefined;
  return (
    <View className="gap-2">
      <Label label={props.label} />
      <LegendList
        horizontal
        data={props.data}
        keyExtractor={({ id }) => id}
        renderItem={({ item }) => (
          <ImageCard
            artwork={item.artwork}
            size={144}
            label={item.name}
            supporting={item.year}
            onPress={() => navigation.navigate("Album", { id: item.id })}
          />
        )}
        className="-mx-4 h-36"
        contentContainerClassName="gap-x-1.5 px-4"
      />
    </View>
  );
}
