import { toast } from "@backpackapp-io/react-native-toast";
import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import type { StaticScreenProps } from "@react-navigation/native";
import { eq } from "drizzle-orm";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { z } from "zod/mini";

import { db } from "~/db";
import { tracksToArtists } from "~/db/schema";

import i18next from "~/modules/i18n";
import { Add } from "~/resources/icons/Add";
import { Close } from "~/resources/icons/Close";
import { upsertAlbums } from "~/api/album";
import { AlbumArtistsKey } from "~/api/album.utils";
import { createArtists } from "~/api/artist";
import { updateTrack } from "~/api/track";
import { useTrack } from "~/queries/track";
import { Resynchronize } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { getArtworkUri } from "~/modules/scanning/helpers/artwork";
import { AppCleanUp } from "~/modules/scanning/helpers/cleanup";
import { FormStateProvider, useFormStateContext } from "~/hooks/useFormState";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { router } from "~/navigation/utils/router";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { clearAllQueries } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { ToastOptions } from "~/lib/toast";
import { splitOn } from "~/utils/string";
import type { ArrayObjectKeys } from "~/utils/types";
import { ScrollablePresets } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { ExtendedTButton } from "~/components/Form/Button";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { StyledText, TEm } from "~/components/Typography/StyledText";

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
function MetadataForm({ bottomOffset }: { bottomOffset: number }) {
  const { t } = useTranslation();
  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      {...ScrollablePresets}
      // Remove 24px as `KeyboardAwareScrollView` adds an element at the
      // end of the ScrollView, causing an additional application of `gap`.
      contentContainerStyle={{ paddingBottom: bottomOffset - 24 }}
      contentContainerClassName="gap-6 p-4"
    >
      <StyledText dim className="text-sm">
        {t("feat.trackMetadata.description.line1")}
        {"\n\n"}
        {t("feat.trackMetadata.description.line2")}
      </StyledText>
      <Divider />

      <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
      <ArrayFormInput labelKey="term.artists" field="artists" />
      <FormInput labelKey="term.album" field="album" />
      <ArrayFormInput
        labelKey="feat.trackMetadata.extra.albumArtist"
        field="albumArtists"
      />
      <View className="flex-row items-end gap-6">
        <FormInput
          labelKey="feat.trackMetadata.extra.year"
          field="year"
          numeric
        />
        <FormInput
          labelKey="feat.trackMetadata.extra.trackNumber"
          field="track"
          numeric
        />
      </View>
      <FormInput
        labelKey="feat.trackMetadata.extra.disc"
        field="disc"
        numeric
      />
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Form Input
function FormInput(props: {
  labelKey: ParseKeys;
  field: keyof TrackMetadata;
  numeric?: boolean;
}) {
  const { data, setField, isSubmitting } = useFormState();

  const value = data[props.field];
  const onChange = (text: string) => {
    const realNum = text.trim() === "" ? null : +text;
    setField((prev) => ({
      ...prev,
      [props.field]: props.numeric
        ? Number.isNaN(realNum)
          ? prev[props.field] // Use prior value if we get `NaN`.
          : realNum
        : text,
    }));
  };

  return (
    <View className="flex-1">
      <TEm textKey={props.labelKey} dim />
      <TextInput
        inputMode={props.numeric ? "numeric" : undefined}
        editable={!isSubmitting}
        value={value !== null ? String(value) : ""}
        onChangeText={onChange}
        className="w-full border-b border-outline"
      />
    </View>
  );
}

function ArrayFormInput(props: {
  labelKey: ParseKeys;
  field: ArrayObjectKeys<TrackMetadata>;
}) {
  const { t } = useTranslation();
  const { data, setField, isSubmitting } = useFormState();

  const field = props.field;
  const value = data[field];

  return (
    <View>
      <TEm textKey={props.labelKey} dim />
      {value.map((value, row) => (
        <View
          key={row}
          className={cn("flex-row items-center", { "mt-2": row > 0 })}
        >
          <TextInput
            editable={!isSubmitting}
            value={value}
            onChangeText={(text) =>
              setField((prev) => ({
                ...prev,
                [field]: prev[field].map((val, idx) =>
                  idx === row ? text : val,
                ),
              }))
            }
            className="shrink grow border-b border-outline"
          />
          <IconButton
            Icon={Close}
            accessibilityLabel={t("template.entryRemove", { name: value })}
            onPress={() =>
              setField((prev) => ({
                ...prev,
                [field]: prev[field].filter((_, idx) => idx !== row),
              }))
            }
            disabled={isSubmitting}
            className="shrink-0"
          />
        </View>
      ))}
      <FilledIconButton
        Icon={Add}
        accessibilityLabel=""
        onPress={() =>
          setField((prev) => ({ ...prev, [field]: [...prev[field], ""] }))
        }
        disabled={isSubmitting}
        className="mt-2 rounded-md bg-secondary active:bg-secondaryDim"
        _iconColor="onSecondary"
      />
    </View>
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
  const { setField, isSubmitting, setIsSubmitting } = useFormState();

  const onReset = async () => {
    setIsSubmitting(true);
    try {
      const trackMetadata = await getMetadata(props.uri, [
        ...MetadataPresets.standard,
        "discNumber",
      ]);
      setField((prev) => ({
        ...prev,
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
      }));
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
const NonEmptyStringSchema = z.string().check(z.trim(), z.minLength(1));
const NullableStringSchema = z.nullable(
  z.pipe(
    z.string().check(z.trim()), // String will get trimmed.
    z.transform((str) => (str === "" ? null : str)),
  ),
);
const NullableRealNumber = z.nullable(z.number().check(z.int(), z.gt(0)));
const TrackMetadataSchema = z.object({
  // Additional context:
  id: z.string(),
  uri: z.string(),
  // Actual form fields:
  name: NonEmptyStringSchema,
  artists: z.array(NonEmptyStringSchema),
  album: NullableStringSchema,
  albumArtists: z.array(NonEmptyStringSchema),
  year: NullableRealNumber,
  disc: NullableRealNumber,
  track: NullableRealNumber,
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
