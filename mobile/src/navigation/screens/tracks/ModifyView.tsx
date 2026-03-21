import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import type { StaticScreenProps } from "@react-navigation/native";
import { eq } from "drizzle-orm";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod/mini";

import { db } from "~/db";
import { tracksToArtists, tracksToGenres } from "~/db/schema";

import { ColorWand } from "~/resources/icons/ColorWand";
import { Info } from "~/resources/icons/Info";
import { upsertAlbums } from "~/data/album/api";
import type { AlbumSummary } from "~/data/album/types";
import { AlbumArtistsKey } from "~/data/album/utils";
import { createArtists } from "~/data/artist/api";
import { createGenres } from "~/data/genre/api";
import { updateTrack } from "~/data/track/api";
import { useTrack, useTrackGenres } from "~/data/track/queries";
import { Resynchronize } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { getArtworkUri } from "~/modules/scanning/helpers/artwork";
import { AppCleanUp } from "~/modules/scanning/helpers/cleanup";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { router } from "~/navigation/utils/router";
import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { AddAlbumSheet } from "./sheets/AddAlbumSheet";

import { clearAllQueries } from "~/lib/react-query";
import { splitOn } from "~/utils/string";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { ExtendedTButton } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { toast } from "~/components/Toast";
import { StyledText } from "~/components/Typography/StyledText";
import { ZSchema } from "~/modules/form/utils";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import {
  ArrayFormInputImpl,
  FormInputImpl,
  InputLabel,
} from "~/modules/form/FormState/FormInput";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyTrack({
  route: {
    params: { id },
  },
}: Props) {
  const trackQuery = useTrack(id);
  const trackGenresQuery = useTrackGenres(id);
  const { offset, floatingContentProps } = useFloatingContent();

  if (
    trackQuery.isPending ||
    trackQuery.error ||
    trackGenresQuery.isPending ||
    trackGenresQuery.error
  ) {
    return (
      <PagePlaceholder
        isPending={trackQuery.isPending || trackGenresQuery.isPending}
      />
    );
  }

  return (
    <FormStateProvider
      schema={TrackMetadataSchema}
      initData={{
        id: trackQuery.data.id,
        uri: trackQuery.data.uri,
        name: trackQuery.data.name,
        artists: trackQuery.data.artists ?? [],
        album: trackQuery.data.album ?? null,
        albumArtists: trackQuery.data.albumArtistsKey
          ? AlbumArtistsKey.deconstruct(trackQuery.data.albumArtistsKey)
          : [],
        year: trackQuery.data.year,
        disc: trackQuery.data.disc,
        track: trackQuery.data.track,
        genres: trackGenresQuery.data ?? [],
      }}
      onSubmit={onEditTrack}
      onConstraints={({ artists, albumArtists, genres }) =>
        artists.length ===
          new Set(artists.map((artist) => artist.trim())).size &&
        albumArtists.length ===
          new Set(albumArtists.map((artist) => artist.trim())).size &&
        genres.length === new Set(genres.map((genre) => genre.trim())).size
      }
    >
      <MetadataForm bottomOffset={offset} />
      <ResetWorkflow
        floatingContentProps={floatingContentProps}
        uri={trackQuery.data.uri}
      />
    </FormStateProvider>
  );
}

//#region Metadata Form
const FormInput = FormInputImpl<TrackMetadata>();
const ArrayFormInput = ArrayFormInputImpl<TrackMetadata>();

function MetadataForm({ bottomOffset }: { bottomOffset: number }) {
  const { t } = useTranslation();
  const { data, setFields, isSubmitting } = useFormState();
  const addAlbumSheetRef = useSheetRef();

  const onSelectAlbum = useCallback(
    (selectedAlbum: AlbumSummary) => {
      setFields({
        album: selectedAlbum.name,
        albumArtists: AlbumArtistsKey.deconstruct(selectedAlbum.artistsKey),
        year: selectedAlbum.maxYear,
      });
      addAlbumSheetRef.current?.dismiss();
    },
    [addAlbumSheetRef, setFields],
  );

  return (
    <>
      <AddAlbumSheet ref={addAlbumSheetRef} onSelect={onSelectAlbum} />
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: bottomOffset }}
        contentContainerClassName="gap-4 p-4"
      >
        <View className="flex-row gap-2 rounded-md bg-surfaceContainerLowest p-4 pl-2">
          <Info size={20} color="onSurfaceVariant" />
          <StyledText dim className="shrink grow text-sm">
            {t("feat.trackMetadata.description.line1")}
            {"\n\n"}
            {t("feat.trackMetadata.description.line2")}
          </StyledText>
        </View>

        <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
        <ArrayFormInput labelKey="term.artists" field="artists" />
        <View className="flex-1">
          <InputLabel
            labelKey="term.album"
            RightElement={
              <IconButton
                Icon={ColorWand}
                accessibilityLabel={t("template.entryAdd", {
                  name: t("term.album"),
                })}
                onPress={() => addAlbumSheetRef.current?.present()}
                disabled={isSubmitting}
                size="xs"
              />
            }
          />
          <TextInput
            editable={!isSubmitting}
            value={data.album || ""}
            onChangeText={(text) => setFields({ album: text })}
            className="w-full rounded-sm border border-outline p-2"
          />
        </View>
        <ArrayFormInput
          labelKey="feat.trackMetadata.extra.albumArtists"
          field="albumArtists"
        />
        <View className="flex-row items-end gap-4">
          <FormInput
            labelKey="feat.trackMetadata.extra.disc"
            field="disc"
            numeric
          />
          <FormInput
            labelKey="feat.trackMetadata.extra.trackNumber"
            field="track"
            numeric
          />
        </View>
        <FormInput
          labelKey="feat.trackMetadata.extra.year"
          field="year"
          numeric
        />
        <ArrayFormInput labelKey="term.genres" field="genres" />
      </KeyboardAwareScrollView>
    </>
  );
}
//#endregion

//#region Reset Workflow
/** Logic to set the form fields to the embedded metadata from the track. */
function ResetWorkflow(
  props: Omit<ReturnType<typeof useFloatingContent>, "offset"> & {
    uri: string;
  },
) {
  const delimiters = usePreferenceStore((s) => s.separators);
  const { setFields, isSubmitting, setIsSubmitting } = useFormState();

  const onReset = async () => {
    setIsSubmitting(true);
    try {
      const trackMetadata = await getMetadata(props.uri, [
        ...MetadataPresets.standard,
        "discNumber",
        "genre",
      ]);
      setFields({
        name: trackMetadata.title ?? "",
        artists: trackMetadata.artist
          ? splitOn(trackMetadata.artist, delimiters)
          : [],
        album: trackMetadata.albumTitle,
        albumArtists: trackMetadata.albumArtist
          ? splitOn(trackMetadata.albumArtist, delimiters)
          : [],
        year: trackMetadata.year,
        disc: trackMetadata.discNumber,
        track: trackMetadata.trackNumber,
        genres: trackMetadata.genre
          ? splitOn(trackMetadata.genre, delimiters)
          : [],
      });
    } catch {}
    setIsSubmitting(false);
  };

  return (
    <View {...props.floatingContentProps}>
      <ExtendedTButton
        textKey="form.reset"
        onPress={onReset}
        disabled={isSubmitting}
        className="bg-error active:bg-errorDim"
        textClassName="text-onError"
      />
    </View>
  );
}
//#endregion

//#region Schema
const TrackMetadataSchema = z.object({
  // Additional context:
  id: z.string(),
  uri: z.string(),
  // Actual form fields:
  name: ZSchema.NonEmptyString,
  artists: z.array(ZSchema.NonEmptyString),
  album: ZSchema.NullableString,
  albumArtists: z.array(ZSchema.NonEmptyString),
  year: ZSchema.NullableRealNumber,
  disc: ZSchema.NullableRealNumber,
  track: ZSchema.NullableRealNumber,
  genres: z.array(ZSchema.NonEmptyString),
});

type TrackMetadata = z.infer<typeof TrackMetadataSchema>;

function useFormState() {
  return useFormStateContext<TrackMetadata>();
}
//#endregion

//#region Submit Handler
async function onEditTrack(data: TrackMetadata) {
  try {
    const { id, uri, album, albumArtists, artists, genres, ...trackBase } =
      data;

    const updatedTrack = {
      ...trackBase,
      embeddedArtwork: null as string | null,
      modificationTime: Date.now(),
      editedMetadata: Date.now(),
    };
    const updatedAlbum = {
      name: album,
      artistsKey: AlbumArtistsKey.from(albumArtists),
    };

    // Add new artists & genres to the database.
    await Promise.allSettled([
      ...artists.map((name) => createArtists([{ name }])),
      ...albumArtists.map((name) => createArtists([{ name }])),
      ...genres.map((name) => createGenres([{ name }])),
    ]);

    const { uri: artworkUri } = await getArtworkUri(uri);

    // Add new album to the database.
    let albumId: string | null = null;
    if (updatedAlbum.name && updatedAlbum.artistsKey) {
      const [newAlbum] = await upsertAlbums([
        {
          name: updatedAlbum.name,
          artistsKey: updatedAlbum.artistsKey,
          embeddedArtwork: artworkUri,
        },
      ]);
      if (newAlbum) albumId = newAlbum.id;
    }
    if (!albumId) updatedTrack.embeddedArtwork = artworkUri;

    // Replace old artist relations.
    await db.delete(tracksToArtists).where(eq(tracksToArtists.trackId, id));
    if (artists.length > 0) {
      await db
        .insert(tracksToArtists)
        .values(artists.map((artistName) => ({ trackId: id, artistName })));
    }

    // Replace old genre relations.
    await db.delete(tracksToGenres).where(eq(tracksToGenres.trackId, id));
    if (genres.length > 0) {
      await db
        .insert(tracksToGenres)
        .values(genres.map((genreName) => ({ trackId: id, genreName })));
    }

    await updateTrack(id, { ...updatedTrack, albumId });

    // Revalidate `activeTrack` in Playback store if needed.
    await Resynchronize.onActiveTrack({ type: "track", id });
    await AppCleanUp.images();
    await AppCleanUp.media();
    clearAllQueries();
    router.back();
  } catch {
    toast.tError("err.flow.generic.title");
  }
}
//#endregion
