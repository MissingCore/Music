// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useShallow } from "zustand/react/shallow";

import { LocalMediaAdapter } from "~/_next/adapters/local-media";
import { q } from "~/_next/data/key-store";

import { PlaybackControls } from "~/stores/Playback/actions";
import { usePlayFromSource } from "~/_next/context/play-from-context";
import { useSearchStore } from "~/_next/context/search-context";
import { useLayoutColumn } from "~/_next/hooks/use-column";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { AdaptiveLayout } from "~/_next/navigation/layout/adaptive-layout";
import * as MediaListLayout from "~/_next/navigation/layout/media-list-layout";
import { GoBack } from "~/_next/navigation/components/go-back";

import { getImageUri } from "~/lib/file-system";
import type { ExtractQueryData } from "~/lib/react-query";
import { containSorter } from "~/_next/utils/search";
import { LegendList } from "~/_next/components/primitives/legend-list";
import { ImageListItem } from "~/_next/components/image-item";
import { TText } from "~/_next/components/typography";

type ScreenData = ExtractQueryData<typeof useGenre>;

function useGenre(id: string) {
  return useQuery({
    queryKey: q.genre.detail(id),
    queryFn: () => LocalMediaAdapter.genre.get(id),
    select: ({ artwork, topTracks, ...rest }) => ({
      ...rest,
      artwork: getImageUri(artwork),
      topTracks: topTracks.map((track) => ({
        ...track,
        artistStr: track.artists !== null ? track.artists.join(", ") : null,
      })),
    }),
  });
}

type Props = StaticScreenProps<{ id: string }>;

//#region Genre Screen
export function Genre({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const { isPending, error, data } = useGenre(id);

  if (isPending)
    return <PagePlaceholder isPending wrapperClassName="pt-safe-offset-18" />;
  if (error)
    return (
      <GoBack message={t("template.notFound", { name: t("term.genre") })} />
    );
  return (
    <AdaptiveLayout artwork={data.artwork}>
      <MediaListLayout.AppBar searchEnabled />
      <ScreenContents
        topTracks={data.topTracks}
        Header={
          <MediaListLayout.Header
            title={data.name}
            artwork={data.artwork}
            Description={
              <MediaListLayout.Metadata
                stats={t("plural.track", { count: data.numTracks })}
                duration={data.totalDuration}
              />
            }
            Actions={<MediaListLayout.ActionBar />}
          />
        }
      />
    </AdaptiveLayout>
  );
}

function ScreenContents({
  Header,
  topTracks,
}: { Header: React.JSX.Element } & Pick<ScreenData, "topTracks">) {
  const source = usePlayFromSource();
  const bottomOffset = useBottomActionsOffset();
  const trackColCnt = useLayoutColumn("list").count;

  const filteredTracks = useSearchStore(
    useShallow((s) => containSorter(topTracks, s.query, ["name", "artistStr"])),
  );

  return (
    <LegendList
      numColumns={trackColCnt}
      data={filteredTracks}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => (
        <ImageListItem
          artwork={item.artwork}
          label={item.name}
          supporting={item.artistStr ?? "—"}
          onPress={() =>
            PlaybackControls.playFromList({ source, trackId: item.id })
          }
        />
      )}
      ListHeaderComponent={Header}
      ListEmptyComponent={
        <View className="p-8">
          <TText textKey="err.msg.noResults" center />
        </View>
      }
      contentContainerClassName="gap-1.5 px-4"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
    />
  );
}
//#endregion
