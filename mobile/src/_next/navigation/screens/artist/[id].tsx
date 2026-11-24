// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import * as v from "valibot";
import { useShallow } from "zustand/react/shallow";

import { LocalMediaAdapter } from "~/_next/adapters/local-media";
import type { MediaItem } from "~/_next/adapters/types";
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

import type { ExtractQueryData } from "~/lib/react-query";
import { OnRTL } from "~/_next/utils/i18n";
import { containSorter } from "~/_next/utils/search";
import { LegendList } from "~/_next/components/primitives/legend-list";
import { ChipButton } from "~/_next/components/button-chip";
import { Divider } from "~/_next/components/divider";
import { Icon } from "~/_next/components/icon";
import { ImageCard, ImageListItem } from "~/_next/components/image-item";
import { Marquee } from "~/_next/components/marquee";
import { Ripple } from "~/_next/components/ripple";
import type { SheetRef } from "~/_next/components/sheet";
import { ScrollableSheet, useSheetRef } from "~/_next/components/sheet";
import { Text, TText } from "~/_next/components/typography";
import { FormProvider, FormSheetHeader } from "~/_next/modules/form";
import { createTypedFormInputs } from "~/_next/modules/form/form-input";

type ScreenData = ExtractQueryData<typeof useArtist>;

function useArtist(id: string) {
  return useQuery({
    queryKey: q.artist.detail(id),
    queryFn: () => LocalMediaAdapter.artist.get(id),
  });
}

type Props = StaticScreenProps<{ id: string }>;

//#region Artist Screen
export function Artist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const { isPending, error, data } = useArtist(id);
  const sheetRef = useSheetRef();

  if (isPending)
    return <PagePlaceholder isPending wrapperClassName="pt-safe-offset-18" />;
  if (error)
    return (
      <GoBack message={t("template.notFound", { name: t("term.artist") })} />
    );
  return (
    <>
      <EditFormSheet ref={sheetRef} name={data.name} artwork={data.artwork} />
      <AdaptiveLayout artwork={data.artwork}>
        <MediaListLayout.AppBar />
        <ScreenContents
          discography={data.discography}
          related={data.related}
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
              Actions={
                <MediaListLayout.ActionBar
                  playable={data.numTracks > 0}
                  RightActions={[
                    <MediaListLayout.EditAction
                      key="edit"
                      onPress={() => sheetRef.current?.present()}
                    />,
                  ]}
                />
              }
            />
          }
        />
      </AdaptiveLayout>
    </>
  );
}

function ScreenContents({
  Header,
  topTracks,
  discography,
  related,
}: { Header: React.JSX.Element } & Pick<
  ScreenData,
  "topTracks" | "discography" | "related"
>) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const source = usePlayFromSource();

  const bottomOffset = useBottomActionsOffset();
  const albumColCnt = useLayoutColumn("grid").count;
  const trackColCnt = useLayoutColumn("list").count;
  const totalColumns = trackColCnt * albumColCnt;

  const renderAlbum = useMemo(
    () =>
      MediaListLayout.renderCardFactory<MediaItem.DisplayAlbum>({
        getKey: ({ id }) => `album-${id}`,
        getProps: ({ id, name, artwork, year }) => ({
          artwork,
          label: name,
          supporting: year,
          onPress: () => navigation.navigate("Album", { id }),
        }),
      }),
    [navigation],
  );
  const renderTrack = useMemo(
    () =>
      MediaListLayout.renderItemFactory<MediaItem.DisplayTrack2>({
        getKey: ({ id }) => `track-${id}`,
        getProps: ({ id: trackId, name, artwork, album }) => ({
          artwork,
          label: name,
          supporting: album ?? "—",
          onPress: () => PlaybackControls.playFromList({ source, trackId }),
        }),
      }),
    [source],
  );

  const limitedTopTracks = useMemo(
    () => topTracks.slice(0, trackColCnt * 5),
    [topTracks, trackColCnt],
  );

  return (
    <LegendList
      numColumns={totalColumns}
      getItemType={(item: React.JSX.Element) => {
        if (item?.type === MediaListLayout.Label) return "label";
        if (item?.type === ImageCard) return "album-item";
        else if (item?.type === ImageListItem) return "track-item";
      }}
      overrideItemLayout={(layout, item: React.JSX.Element) => {
        if (item?.type === ImageCard) layout.span = trackColCnt;
        else if (item?.type === ImageListItem) layout.span = albumColCnt;
        else if (item) layout.span = totalColumns;
      }}
      ListHeaderComponent={Header}
      contentContainerClassName="gap-1.5 px-4"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
    >
      {limitedTopTracks.length > 0 ? (
        <Ripple
          onPress={() =>
            navigation.navigate("ArtistTopTracks", { id: source.id })
          }
          className="-mx-4 flex-row items-center px-4 py-1.5"
        >
          <Marquee wrapperClassName="grow-0">
            <Text bold size="xl">
              {t("feat.recap.extra.top", { name: t("term.tracks") })}
            </Text>
          </Marquee>
          <Icon name={OnRTL.decide("left", "right")} size={32} />
        </Ripple>
      ) : null}
      {limitedTopTracks.map(renderTrack)}

      {MediaListLayout.renderLabel(t("term.albums"), discography.albums)}
      {discography.albums.map(renderAlbum)}

      {MediaListLayout.renderLabel(t("term.eps"), discography.eps)}
      {discography.eps.map(renderAlbum)}

      {MediaListLayout.renderLabel(t("term.singles"), discography.singles)}
      {discography.singles.map(renderTrack)}

      {related.albums.length > 0 || related.genres.length > 0 ? (
        <Divider className="mt-4" />
      ) : null}

      {MediaListLayout.renderLabel(t("term.appearsIn"), related.albums)}
      {related.albums.map(renderAlbum)}

      {related.genres.length > 0 ? (
        <View className="mt-4 flex-row flex-wrap gap-1.5">
          {related.genres.map((genre) => (
            <ChipButton
              key={genre}
              label={genre}
              onPress={() => navigation.navigate("Genre", { id: genre })}
            />
          ))}
        </View>
      ) : null}
    </LegendList>
  );
}
//#endregion

//#region Top Tracks Screen
export function ArtistTopTracks({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const { isPending, error, data } = useArtist(id);

  if (isPending)
    return <PagePlaceholder isPending wrapperClassName="pt-safe-offset-18" />;
  if (error)
    return (
      <GoBack message={t("template.notFound", { name: t("term.artist") })} />
    );
  return (
    <AdaptiveLayout artwork={data.artwork}>
      <MediaListLayout.AppBar searchEnabled />
      <TopTracksScreenContents topTracks={data.topTracks} />
    </AdaptiveLayout>
  );
}

function TopTracksScreenContents({ topTracks }: Pick<ScreenData, "topTracks">) {
  const source = usePlayFromSource();
  const bottomOffset = useBottomActionsOffset();
  const trackColCnt = useLayoutColumn("list").count;

  const filteredTracks = useSearchStore(
    useShallow((s) => containSorter(topTracks, s.query, ["name", "album"])),
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
          supporting={item.album ?? "—"}
          onPress={() =>
            PlaybackControls.playFromList({ source, trackId: item.id })
          }
        />
      )}
      ListEmptyComponent={
        <View className="p-8">
          <TText textKey="err.msg.noResults" center />
        </View>
      }
      contentContainerClassName="gap-1.5 px-4 pt-safe-offset-18"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
    />
  );
}
//#endregion

//#region Edit Form
function EditFormSheet(props: {
  ref: SheetRef;
  name: string;
  artwork: string | null;
}) {
  const { t } = useTranslation();
  const [presented, setPresented] = useState(false);
  return (
    <FormProvider
      schema={ArtistFormSchema}
      initData={{
        initArtwork: props.artwork,
        name: props.name,
        artwork: props.artwork,
      }}
      onSubmit={() => console.log("Updating artist...")}
      handleGoBack={presented ? () => props.ref.current?.dismiss() : undefined}
    >
      <ScrollableSheet
        ref={props.ref}
        dismissible={false}
        setVisibility={setPresented}
        header={<FormSheetHeader label={t("form.edit")} />}
      >
        <View className="flex-row items-center gap-4">
          <FormInput.Image />
          <FormInput.Text
            label={t("feat.trackMetadata.extra.name")}
            field="name"
          />
        </View>
      </ScrollableSheet>
    </FormProvider>
  );
}

const ArtistFormSchema = v.object({
  // Context
  initArtwork: v.nullable(v.string()),
  // Actual Fields
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  artwork: v.nullable(v.string()),
});

const FormInput =
  createTypedFormInputs<v.InferOutput<typeof ArtistFormSchema>>();
//#endregion
