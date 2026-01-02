import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { ParseKeys } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { z } from "zod/mini";

import type { TrackWithRelations } from "~/db/schema";

import { Check } from "~/resources/icons/Check";
import { useTrack } from "~/queries/track";
import { useFormState } from "~/hooks/useFormState";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { ScrollablePresets } from "~/components/Defaults";
import { ExtendedTButton } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { ModalTemplate } from "~/components/Modal";
import { TEm } from "~/components/Typography/StyledText";

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
  });
  const { offset, ...rest } = useFloatingContent();

  const onSubmit = useCallback(() => {}, []);

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
        <FormInput
          labelKey="feat.trackMetadata.extra.name"
          value={formState.data.name}
          setValue={(name) => formState.setField("name", name)}
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
