import { toast } from "@backpackapp-io/react-native-toast";
import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { eq } from "drizzle-orm";
import type { ParseKeys } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { z } from "zod/mini";

import { db } from "~/db";
import type { TrackWithRelations } from "~/db/schema";
import { tracksToArtists } from "~/db/schema";

import { Add } from "~/resources/icons/Add";
import { Check } from "~/resources/icons/Check";
import { Close } from "~/resources/icons/Close";
import { upsertAlbums } from "~/api/album";
import { createArtists } from "~/api/artist";
import { updateTrack } from "~/api/track";
import { useTrack } from "~/queries/track";
import { Resynchronize } from "~/stores/Playback/actions";
import { removeUnusedCategories } from "~/modules/scanning/helpers/audio";
import {
  cleanupImages,
  getArtworkUri,
} from "~/modules/scanning/helpers/artwork";
import { useFormState } from "~/hooks/useFormState";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { Colors } from "~/constants/Styles";
import { clearAllQueries } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { ToastOptions } from "~/lib/toast";
import { wait } from "~/utils/promise";
import { ScrollablePresets } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { ExtendedTButton } from "~/components/Form/Button";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { ModalTemplate } from "~/components/Modal";
import { StyledText, TEm } from "~/components/Typography/StyledText";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyTrack({
  route: {
    params: { id },
  },
}: Props) {
  const { isPending, error, data } = useTrack(id);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return <FormContextDelegate initData={data} />;
}

//#region Context Delegate
function FormContextDelegate({ initData }: { initData: TrackWithRelations }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const formState = useFormState({
    schema: TrackMetadataSchema,
    initData: {
      name: initData.name,
      artists: initData.tracksToArtists.map(({ artistName }) => artistName),
      album: initData.album ? initData.album.name : null,
      albumArtist: initData.album ? initData.album.artistName : null,
      year: initData.year,
      disc: initData.disc,
      track: initData.track,
    },
    onConstraints: ({ artists }) =>
      artists.length === new Set(artists.map((artist) => artist.trim())).size,
  });
  const { offset, ...rest } = useFloatingContent();

  const onSubmit = useCallback(async () => {
    if (!formState.canSubmit) return;
    setIsSubmitting(true);
    // Slight buffer before running heavy async task.
    await wait(1);
    try {
      const { id, uri } = initData;
      const { album, albumArtist, artists, ...trackBase } =
        TrackMetadataSchema.parse(formState.data);

      const updatedTrack = {
        ...trackBase,
        embeddedArtwork: null as string | null,
        modificationTime: Date.now(),
        editedMetadata: Date.now(),
      };
      const updatedAlbum = { name: album, artistName: albumArtist };

      // Add new artists to the database.
      await Promise.allSettled(
        [...artists, updatedAlbum.artistName]
          .filter((name) => name !== null)
          .map((name) => createArtists([{ name }])),
      );

      const { uri: artworkUri } = await getArtworkUri(uri);

      // Add new album to the database.
      let albumId: string | null = null;
      if (updatedAlbum.name && updatedAlbum.artistName) {
        const [newAlbum] = await upsertAlbums([
          {
            name: updatedAlbum.name,
            artistName: updatedAlbum.artistName,
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
      await cleanupImages();
      await removeUnusedCategories();
      clearAllQueries();
      navigation.goBack();
    } catch {
      toast.error(t("err.flow.generic.title"), ToastOptions);
    }
    setIsSubmitting(false);
  }, [t, navigation, initData, formState.canSubmit, formState.data]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!formState.hasChanged) return false;
        if (!isSubmitting) setShowConfirmation(true);
        return true;
      },
    );
    return () => subscription.remove();
  }, [formState.hasChanged, isSubmitting]);

  return (
    <>
      <TopAppBar
        canSubmit={formState.canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />

      <KeyboardAwareScrollView
        bottomOffset={16}
        {...ScrollablePresets}
        // Remove 24px as `KeyboardAwareScrollView` adds an element at the
        // end of the ScrollView, causing an additional application of `gap`.
        contentContainerStyle={{ paddingBottom: offset - 24 }}
        contentContainerClassName="gap-6 p-4"
      >
        <StyledText dim className="text-sm">
          {t("feat.trackMetadata.description.line1")}
          {"\n\n"}
          {t("feat.trackMetadata.description.line2")}
        </StyledText>
        <Divider />

        <FormInput
          labelKey="feat.trackMetadata.extra.name"
          value={formState.data.name}
          setValue={(name) => formState.setField("name", name)}
          enabled={!isSubmitting}
        />
        <ArrayFormInput
          labelKey="term.artists"
          value={formState.data.artists}
          setValue={(artists) => formState.setField("artists", artists)}
          enabled={!isSubmitting}
        />
        <FormInput
          labelKey="term.album"
          value={formState.data.album}
          setValue={(album) => formState.setField("album", album)}
          enabled={!isSubmitting}
        />
        <FormInput
          labelKey="feat.trackMetadata.extra.albumArtist"
          value={formState.data.albumArtist}
          setValue={(albumArtist) =>
            formState.setField("albumArtist", albumArtist)
          }
          enabled={!isSubmitting}
        />
        <View className="flex-row items-end gap-6">
          <FormInput
            labelKey="feat.trackMetadata.extra.year"
            value={formState.data.year}
            setValue={(year) => {
              formState.setField("year", year.trim() === "" ? null : +year);
            }}
            enabled={!isSubmitting}
            numeric
          />
          <FormInput
            labelKey="feat.trackMetadata.extra.trackNumber"
            value={formState.data.track}
            setValue={(track) => {
              formState.setField("track", track.trim() === "" ? null : +track);
            }}
            enabled={!isSubmitting}
            numeric
          />
        </View>
        <FormInput
          labelKey="feat.trackMetadata.extra.disc"
          value={formState.data.disc}
          setValue={(disc) => {
            formState.setField("disc", disc.trim() === "" ? null : +disc);
          }}
          enabled={!isSubmitting}
          numeric
        />
      </KeyboardAwareScrollView>

      <ConfirmationModal
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
      />
      <ResetWorkflow
        {...rest}
        uri={initData.uri}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        setFields={formState.setFields}
      />
    </>
  );
}
//#endregion

//#region Top App Bar
function TopAppBar(props: {
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: VoidFunction;
}) {
  const { t } = useTranslation();
  return (
    <ScreenOptions
      title="feat.trackMetadata.title"
      // Hacky solution to disable the back button when submitting.
      headerLeft={props.isSubmitting ? () => undefined : undefined}
      headerRight={() => (
        <IconButton
          Icon={Check}
          accessibilityLabel={t("form.apply")}
          onPress={props.onSubmit}
          disabled={!props.canSubmit || props.isSubmitting}
        />
      )}
    />
  );
}
//#endregion

//#region Form Input
function FormInput<TData>(props: {
  labelKey: ParseKeys;
  value: TData;
  setValue: (value: string) => void;
  enabled?: boolean;
  numeric?: boolean;
}) {
  return (
    <View className="flex-1">
      <TEm textKey={props.labelKey} dim />
      <TextInput
        inputMode={props.numeric ? "numeric" : undefined}
        editable={props.enabled}
        value={props.value !== null ? String(props.value) : ""}
        onChangeText={props.setValue}
        className="w-full border-b border-foreground/60"
      />
    </View>
  );
}

function ArrayFormInput(props: {
  labelKey: ParseKeys;
  value: string[];
  setValue: (value: string[]) => void;
  enabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <TEm textKey={props.labelKey} dim />
      <View className="gap-2">
        {props.value.map((value, index) => (
          <View key={index} className="flex-row items-center">
            <TextInput
              editable={props.enabled}
              value={value}
              onChangeText={(text) =>
                props.setValue(
                  props.value.map((val, idx) => (idx === index ? text : val)),
                )
              }
              className="shrink grow border-b border-foreground/60"
            />
            <IconButton
              Icon={Close}
              accessibilityLabel={t("template.entryRemove", { name: value })}
              onPress={() =>
                props.setValue(props.value.filter((_, idx) => idx !== index))
              }
              disabled={!props.enabled}
              className="shrink-0"
            />
          </View>
        ))}
        <FilledIconButton
          Icon={Add}
          accessibilityLabel=""
          onPress={() => props.setValue([...props.value, ""])}
          disabled={!props.enabled}
          className={cn("rounded-md bg-yellow", {
            "mt-2": props.value.length === 0,
          })}
          _iconColor={Colors.neutral0}
        />
      </View>
    </View>
  );
}
//#endregion

//#region Confirmation Modal
/** Modal that's rendered if we have unsaved changes. */
function ConfirmationModal(props: {
  showConfirmation: boolean;
  setShowConfirmation: (state: boolean) => void;
}) {
  const navigation = useNavigation();
  return (
    <ModalTemplate
      visible={props.showConfirmation}
      titleKey="form.unsaved"
      topAction={{
        textKey: "form.leave",
        onPress: () => navigation.goBack(),
      }}
      bottomAction={{
        textKey: "form.stay",
        onPress: () => props.setShowConfirmation(false),
      }}
    />
  );
}
//#endregion

//#region Reset Workflow
/** Logic to set the form fields to the embedded metadata from the track. */
function ResetWorkflow(
  props: Omit<ReturnType<typeof useFloatingContent>, "offset"> & {
    uri: string;
    isSubmitting: boolean;
    setIsSubmitting: (state: boolean) => void;
    setFields: (data: TrackMetadata) => void;
  },
) {
  const onReset = async () => {
    props.setIsSubmitting(true);
    try {
      const trackMetadata = await getMetadata(props.uri, [
        ...MetadataPresets.standard,
        "discNumber",
      ]);
      props.setFields({
        name: trackMetadata.title ?? "",
        artists: trackMetadata.artist ? [trackMetadata.artist] : [],
        album: trackMetadata.albumTitle,
        albumArtist: trackMetadata.albumArtist,
        year: trackMetadata.year,
        disc: trackMetadata.discNumber,
        track: trackMetadata.trackNumber,
      });
    } catch {}
    props.setIsSubmitting(false);
  };

  return (
    <View ref={props.floatingRef} {...props.wrapperStyling}>
      <ExtendedTButton
        textKey="form.reset"
        onPress={onReset}
        disabled={props.isSubmitting}
        className="bg-red"
        textClassName="text-neutral100"
      />
    </View>
  );
}
//#endregion

//#region Schema
const NonEmptyStringSchema = z.string().check(z.trim(), z.minLength(1));
const NullableStringSchema = z.pipe(
  z.string().check(z.trim()),
  z.transform((str) => {
    const trimmedStr = str.trim();
    return trimmedStr === "" ? null : trimmedStr;
  }),
);
const RealNumber = z.number().check(z.int(), z.gt(0));
const TrackMetadataSchema = z.object({
  name: NonEmptyStringSchema,
  artists: z.array(NonEmptyStringSchema),
  album: NullableStringSchema,
  albumArtist: NullableStringSchema,
  year: z.nullable(RealNumber),
  disc: z.nullable(RealNumber),
  track: z.nullable(RealNumber),
});

type TrackMetadata = z.infer<typeof TrackMetadataSchema>;
//#endregion
