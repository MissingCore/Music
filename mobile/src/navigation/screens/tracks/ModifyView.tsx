import { toast } from "@backpackapp-io/react-native-toast";
import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import type { StaticScreenProps } from "@react-navigation/native";
import { eq } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { z } from "zod/mini";

import { db } from "~/db";
import { tracksToArtists } from "~/db/schema";

import i18next from "~/modules/i18n";
import { Info } from "~/resources/icons/Info";
import { upsertAlbums } from "~/api/album";
import { AlbumArtistsKey } from "~/api/album.utils";
import { createArtists } from "~/api/artist";
import { updateTrack } from "~/api/track";
import { useTrack } from "~/queries/track";
import { Resynchronize } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { getArtworkUri } from "~/modules/scanning/helpers/artwork";
import { AppCleanUp } from "~/modules/scanning/helpers/cleanup";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { router } from "~/navigation/utils/router";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { clearAllQueries } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { splitOn } from "~/utils/string";
import { ScrollablePresets } from "~/components/Defaults";
import { ExtendedTButton } from "~/components/Form/Button";
import { StyledText } from "~/components/Typography/StyledText";
import { ZSchema } from "~/modules/form/utils";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import {
  ArrayFormInputImpl,
  FormInputImpl,
} from "~/modules/form/FormState/FormInput";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyTrack({
  route: {
    params: { id },
  },
}: Props) {
  const { isPending, error, data } = useTrack(id);
  const { offset, ...rest } = useFloatingContent();

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return (
    <FormStateProvider
      schema={TrackMetadataSchema}
      initData={{
        id: data.id,
        uri: data.uri,
        name: data.name,
        artists: data.tracksToArtists.map(({ artistName }) => artistName),
        album: data.album?.name ?? null,
        albumArtists: data.album
          ? AlbumArtistsKey.deconstruct(data.album.artistsKey)
          : [],
        year: data.year,
        disc: data.disc,
        track: data.track,
      }}
      onSubmit={onEditTrack}
      onConstraints={({ artists, albumArtists }) =>
        artists.length ===
          new Set(artists.map((artist) => artist.trim())).size &&
        albumArtists.length ===
          new Set(albumArtists.map((artist) => artist.trim())).size
      }
    >
      <MetadataForm bottomOffset={offset} />
      <ResetWorkflow {...rest} uri={data.uri} />
    </FormStateProvider>
  );
}

//#region Metadata Form
const FormInput = FormInputImpl<TrackMetadata>();
const ArrayFormInput = ArrayFormInputImpl<TrackMetadata>();

function MetadataForm({ bottomOffset }: { bottomOffset: number }) {
  const { t } = useTranslation();
  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      {...ScrollablePresets}
      // Remove 16px as `KeyboardAwareScrollView` adds an element at the
      // end of the ScrollView, causing an additional application of `gap`.
      contentContainerStyle={{ paddingBottom: bottomOffset - 16 }}
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
      <FormInput labelKey="term.album" field="album" />
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
    </KeyboardAwareScrollView>
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
      });
    } catch {}
    setIsSubmitting(false);
  };

  return (
    <View ref={props.floatingRef} {...props.wrapperStyling}>
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
});

type TrackMetadata = z.infer<typeof TrackMetadataSchema>;

function useFormState() {
  return useFormStateContext<TrackMetadata>();
}
//#endregion

//#region Submit Handler
async function onEditTrack(data: TrackMetadata) {
  try {
    const { id, uri, album, albumArtists, artists, ...trackBase } = data;

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

    // Add new artists to the database.
    await Promise.allSettled(
      [...artists, ...albumArtists]
        .filter((name) => name !== null)
        .map((name) => createArtists([{ name }])),
    );

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

    await updateTrack(id, { ...updatedTrack, albumId });

    // Revalidate `activeTrack` in Playback store if needed.
    await Resynchronize.onActiveTrack({ type: "track", id });
    await AppCleanUp.images();
    await AppCleanUp.media();
    clearAllQueries();
    router.back();
  } catch {
    toast.error(i18next.t("err.flow.generic.title"), ToastOptions);
  }
}
//#endregion
