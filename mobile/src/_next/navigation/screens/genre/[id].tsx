// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import * as v from "valibot";
import { useShallow } from "zustand/react/shallow";

import { LocalMediaAdapter } from "~/_next/adapters/local-media";
import { q } from "~/_next/data/key-store";

import { PlaybackControls, Resynchronize } from "~/stores/Playback/actions";
import { usePlayFromSource } from "~/_next/context/play-from-context";
import { useSearchStore } from "~/_next/context/search-context";
import { useLayoutColumn } from "~/_next/hooks/use-column";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { AdaptiveLayout } from "~/_next/navigation/layout/adaptive-layout";
import * as MediaListLayout from "~/_next/navigation/layout/media-list-layout";
import { GoBack } from "~/_next/navigation/components/go-back";

import type { ExtractQueryData } from "~/lib/react-query";
import { clearAllQueries } from "~/lib/react-query";
import { containSorter } from "~/_next/utils/search";
import { LegendList } from "~/_next/components/primitives/legend-list";
import { ImageListItem } from "~/_next/components/image-item";
import type { SheetRef } from "~/_next/components/sheet";
import { ScrollableSheet, useSheetRef } from "~/_next/components/sheet";
import { TText } from "~/_next/components/typography";
import { FormProvider, FormSheetHeader } from "~/_next/modules/form";
import { createTypedFormInputs } from "~/_next/modules/form/form-input";

type ScreenData = ExtractQueryData<typeof useGenre>;

function useGenre(id: string) {
  return useQuery({
    queryKey: q.genre.detail(id),
    queryFn: () => LocalMediaAdapter.genre.get(id),
    select: ({ topTracks, ...rest }) => ({
      ...rest,
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
  const sheetRef = useSheetRef();

  if (isPending)
    return <PagePlaceholder isPending wrapperClassName="pt-safe-offset-18" />;
  if (error)
    return (
      <GoBack message={t("template.notFound", { name: t("term.genre") })} />
    );
  return (
    <>
      <EditFormSheet ref={sheetRef} name={data.name} artwork={data.artwork} />
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
              Actions={
                <MediaListLayout.ActionBar
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

//#region Edit Form
const GenreFormSchema = v.object({
  // Context
  initArtwork: v.nullable(v.string()),
  // Actual Fields
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  artwork: v.nullable(v.string()),
});

const FormInput =
  createTypedFormInputs<v.InferOutput<typeof GenreFormSchema>>();

function EditFormSheet(props: {
  ref: SheetRef;
  name: string;
  artwork: string | null;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation("Genre");
  const [presented, setPresented] = useState(false);

  return (
    <FormProvider
      schema={GenreFormSchema}
      initData={{
        initArtwork: props.artwork,
        name: props.name,
        artwork: props.artwork,
      }}
      onSubmit={async (_, changes) => {
        try {
          await LocalMediaAdapter.genre.update(props.name, changes);

          clearAllQueries();
          props.ref.current?.dismiss();
          if (changes.name) {
            await Resynchronize.onRename({
              oldSource: { type: "genre", id: props.name },
              newSource: { type: "genre", id: changes.name },
            });

            navigation.setParams({ id: changes.name });
          }
        } catch (err) {
          toast.tError("err.flow.generic.title");
          throw err;
        }
      }}
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
//#endregion
