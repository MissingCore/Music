import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Check } from "~/icons/Check";
import type { InitStoreProps, TrackMetadataForm } from "./context";
import { TrackMetadataStoreProvider, useTrackMetadataStore } from "./context";

import { IconButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { Modal, ModalAction } from "~/components/Modal";
import { TEm, TStyledText } from "~/components/Typography/StyledText";

export function ModifyTrack(props: InitStoreProps) {
  return (
    <TrackMetadataStoreProvider {...props}>
      <ScreenConfig />
      <MetadataForm />
      <ConfirmationModal />
    </TrackMetadataStoreProvider>
  );
}

//#region Screen Header
/** Configuration for the top app bar. */
function ScreenConfig() {
  const { t } = useTranslation();

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
            disabled={isUnchanged || isSubmitting}
          />
        ),
      }}
    />
  );
}
//#endregion

//#region Metadata Form
function MetadataForm() {
  return (
    <View className="gap-2 py-4">
      <View>
        <TEm textKey="feat.trackMetadata.extra.name" />
        <FormInput field="name" />
      </View>
      <View>
        <TEm textKey="term.artist" />
        <FormInput field="artistName" />
      </View>
      <View>
        <TEm textKey="term.album" />
        <FormInput field="album" />
      </View>
      <View>
        <TEm textKey="feat.trackMetadata.extra.albumArtist" />
        <FormInput field="albumArtist" />
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <TEm textKey="feat.trackMetadata.extra.year" />
          <FormInput field="year" numeric />
        </View>
        <View className="flex-1">
          <TEm textKey="feat.trackMetadata.extra.trackNumber" />
          <FormInput field="track" numeric />
        </View>
      </View>
      <View>
        <TEm textKey="feat.trackMetadata.extra.disc" />
        <FormInput field="disc" numeric />
      </View>
    </View>
  );
}

function FormInput(props: {
  field: keyof TrackMetadataForm;
  numeric?: boolean;
}) {
  const initFormData = useTrackMetadataStore((state) => state.initialFormData);
  const isSubmitting = useTrackMetadataStore((state) => state.isSubmitting);
  const setField = useTrackMetadataStore((state) => state.setField);

  return (
    <TextInput
      inputMode={props.numeric ? "numeric" : undefined}
      editable={!isSubmitting}
      defaultValue={initFormData[props.field]}
      onChangeText={setField(props.field)}
      className="shrink grow border-b border-foreground/60"
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
