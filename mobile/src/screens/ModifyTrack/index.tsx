import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Check } from "~/icons/Check";
import { useTheme } from "~/hooks/useTheme";
import type { InitStoreProps, TrackMetadataForm } from "./context";
import { TrackMetadataStoreProvider, useTrackMetadataStore } from "./context";

import { ScrollablePresets } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { IconButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { Modal, ModalAction } from "~/components/Modal";
import {
  StyledText,
  TEm,
  TStyledText,
} from "~/components/Typography/StyledText";

export function ModifyTrack(props: InitStoreProps) {
  return (
    <TrackMetadataStoreProvider {...props}>
      <ScreenConfig />
      <MetadataForm />
      <ConfirmationModal />
      <ResetWorkflow />
    </TrackMetadataStoreProvider>
  );
}

//#region Screen Header
/** Configuration for the top app bar. */
function ScreenConfig() {
  const { t } = useTranslation();

  const trackName = useTrackMetadataStore((state) => state.name);
  const isUnchanged = useTrackMetadataStore((state) => state.isUnchanged);
  const isSubmitting = useTrackMetadataStore((state) => state.isSubmitting);
  const onSubmit = useTrackMetadataStore((state) => state.onSubmit);

  return (
    <Stack.Screen
      options={{
        headerTitle: t("feat.trackMetadata.title"),
        // Hacky solution to disable the back button when submitting.
        headerLeft: isSubmitting ? () => undefined : undefined,
        headerRight: () => (
          <IconButton
            Icon={Check}
            accessibilityLabel={t("form.apply")}
            onPress={onSubmit}
            disabled={
              isUnchanged || trackName.trim().length === 0 || isSubmitting
            }
          />
        ),
      }}
    />
  );
}
//#endregion

//#region Metadata Form
function MetadataForm() {
  const { t } = useTranslation();

  const isUnchanged = useTrackMetadataStore((state) => state.isUnchanged);
  const isSubmitting = useTrackMetadataStore((state) => state.isSubmitting);
  const setShowConfirmation = useTrackMetadataStore(
    (state) => state.setShowConfirmation,
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isUnchanged) return false;
        if (!isSubmitting) setShowConfirmation(true);
        return true;
      },
    );
    return () => subscription.remove();
  }, [isSubmitting, isUnchanged, setShowConfirmation]);

  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      {...ScrollablePresets}
      contentContainerClassName="gap-6 p-4"
    >
      <StyledText dim className="text-center text-sm">
        {t("feat.trackMetadata.description.line1")}
        {"\n\n"}
        {t("feat.trackMetadata.description.line2")}
      </StyledText>
      <Divider />

      <View>
        <TEm textKey="feat.trackMetadata.extra.name" dim />
        <FormInput field="name" />
      </View>
      <View>
        <TEm textKey="term.artist" dim />
        <FormInput field="artistName" />
      </View>
      <View>
        <TEm textKey="term.album" dim />
        <FormInput field="album" />
      </View>
      <View>
        <TEm textKey="feat.trackMetadata.extra.albumArtist" dim />
        <FormInput field="albumArtist" />
      </View>
      <View className="flex-row items-end gap-6">
        <View className="flex-1">
          <TEm textKey="feat.trackMetadata.extra.year" dim />
          <FormInput field="year" numeric />
        </View>
        <View className="flex-1">
          <TEm textKey="feat.trackMetadata.extra.trackNumber" dim />
          <FormInput field="track" numeric />
        </View>
      </View>
      <View>
        <TEm textKey="feat.trackMetadata.extra.disc" dim />
        <FormInput field="disc" numeric />
      </View>
    </KeyboardAwareScrollView>
  );
}

function FormInput(props: {
  field: keyof TrackMetadataForm;
  numeric?: boolean;
}) {
  const initFormData = useTrackMetadataStore((state) => state.initialFormData);
  const isSubmitting = useTrackMetadataStore((state) => state.isSubmitting);
  const field = useTrackMetadataStore((state) => state[props.field]);
  const setField = useTrackMetadataStore((state) => state.setField);

  return (
    <TextInput
      inputMode={props.numeric ? "numeric" : undefined}
      editable={!isSubmitting}
      defaultValue={initFormData[props.field]}
      value={field}
      onChangeText={setField(props.field)}
      className="w-full border-b border-foreground/60"
    />
  );
}
//#endregion

//#region Confirmation Modal
/** Modal that's rendered if we have unsaved changes. */
function ConfirmationModal() {
  const showConfirmation = useTrackMetadataStore(
    (state) => state.showConfirmation,
  );
  const setShowConfirmation = useTrackMetadataStore(
    (state) => state.setShowConfirmation,
  );

  return (
    <Modal visible={showConfirmation}>
      <TStyledText textKey="form.unsaved" className="pt-8 text-center" />
      <View className="flex-row justify-end gap-4">
        <ModalAction
          textKey="form.stay"
          onPress={() => setShowConfirmation(false)}
        />
        <ModalAction
          textKey="form.leave"
          onPress={() => router.back()}
          danger
        />
      </View>
    </Modal>
  );
}
//#endregion

//#region Reset Workflow
/** Logic to set the form fields to the embedded metadata from the track. */
function ResetWorkflow() {
  const { t } = useTranslation();
  const { canvas } = useTheme();

  const { uri } = useTrackMetadataStore((state) => state.initialData);
  const isSubmitting = useTrackMetadataStore((state) => state.isSubmitting);
  const setIsSubmitting = useTrackMetadataStore(
    (state) => state.setIsSubmitting,
  );
  const setFields = useTrackMetadataStore((state) => state.setFields);

  const onReset = async () => {
    setIsSubmitting(true);
    try {
      const trackMetadata = await getMetadata(uri, [
        ...MetadataPresets.standard,
        "discNumber",
      ]);
      setFields({
        name: trackMetadata.title ?? "",
        artistName: trackMetadata.artist ?? "",
        album: trackMetadata.albumTitle ?? "",
        albumArtist: trackMetadata.albumArtist ?? "",
        year: (trackMetadata.year ?? "").toString(),
        disc: (trackMetadata.discNumber ?? "").toString(),
        track: (trackMetadata.trackNumber ?? "").toString(),
      });
    } catch {}
    setIsSubmitting(false);
  };

  return (
    <Pressable
      android_ripple={{ color: canvas }}
      onPress={onReset}
      disabled={isSubmitting}
      className="min-h-12 justify-center bg-surface disabled:opacity-25"
    >
      <StyledText className="text-center text-sm text-red">
        {t("form.reset").toLocaleUpperCase()}
      </StyledText>
    </Pressable>
  );
}
//#endregion
