import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Check } from "~/resources/icons/Check";
import { useFloatingContent } from "../../../hooks/useFloatingContent";
import type { InitStoreProps, TrackMetadataForm } from "./store";
import {
  TrackMetadataStoreProvider,
  useTrackMetadataIsUnchanged,
  useTrackMetadataStore,
} from "./store";

import { ScrollablePresets } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { Button, IconButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { ModalTemplate } from "~/components/Modal";
import {
  StyledText,
  TEm,
  TStyledText,
} from "~/components/Typography/StyledText";
import { ScreenOptions } from "../../../components/ScreenOptions";

export function ModifyTrackBase(props: InitStoreProps) {
  const { offset, ...rest } = useFloatingContent();
  return (
    <TrackMetadataStoreProvider {...props}>
      <ScreenConfig />
      <MetadataForm bottomOffset={offset} />
      <ConfirmationModal />
      <ResetWorkflow {...rest} />
    </TrackMetadataStoreProvider>
  );
}

//#region Screen Header
/** Configuration for the top app bar. */
function ScreenConfig() {
  const { t } = useTranslation();

  const isUnchanged = useTrackMetadataIsUnchanged();
  const trackName = useTrackMetadataStore((state) => state.name);
  const isSubmitting = useTrackMetadataStore((state) => state.isSubmitting);
  const onSubmit = useTrackMetadataStore((state) => state.onSubmit);

  return (
    <ScreenOptions
      title="feat.trackMetadata.title"
      // Hacky solution to disable the back button when submitting.
      headerLeft={isSubmitting ? () => undefined : undefined}
      headerRight={() => (
        <IconButton
          Icon={Check}
          accessibilityLabel={t("form.apply")}
          onPress={onSubmit}
          disabled={
            isUnchanged || trackName.trim().length === 0 || isSubmitting
          }
        />
      )}
    />
  );
}
//#endregion

//#region Metadata Form
function MetadataForm({ bottomOffset }: { bottomOffset: number }) {
  const { t } = useTranslation();

  const isUnchanged = useTrackMetadataIsUnchanged();
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
      // Remove 24px as `KeyboardAwareScrollView` adds an element at the
      // end of the ScrollView, causing an additional application of `gap`.
      contentContainerStyle={{ paddingBottom: bottomOffset - 24 }}
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
  const isSubmitting = useTrackMetadataStore((state) => state.isSubmitting);
  const field = useTrackMetadataStore((state) => state[props.field]);
  const setField = useTrackMetadataStore((state) => state.setField);

  return (
    <TextInput
      inputMode={props.numeric ? "numeric" : undefined}
      editable={!isSubmitting}
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
  const navigation = useNavigation();
  const showConfirmation = useTrackMetadataStore(
    (state) => state.showConfirmation,
  );
  const setShowConfirmation = useTrackMetadataStore(
    (state) => state.setShowConfirmation,
  );

  return (
    <ModalTemplate
      visible={showConfirmation}
      titleKey="form.unsaved"
      leftAction={{
        textKey: "form.stay",
        onPress: () => setShowConfirmation(false),
      }}
      rightAction={{
        textKey: "form.leave",
        onPress: () => navigation.goBack(),
      }}
    />
  );
}
//#endregion

//#region Reset Workflow
/** Logic to set the form fields to the embedded metadata from the track. */
function ResetWorkflow({
  onLayout,
  wrapperStyling,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
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
        year: trackMetadata.year?.toString() ?? "",
        disc: trackMetadata.discNumber?.toString() ?? "",
        track: trackMetadata.trackNumber?.toString() ?? "",
      });
    } catch {}
    setIsSubmitting(false);
  };

  return (
    <View onLayout={onLayout} {...wrapperStyling}>
      <Button
        onPress={onReset}
        disabled={isSubmitting}
        className="w-full bg-red"
      >
        <TStyledText
          textKey="form.reset"
          className="text-center text-neutral100"
        />
      </Button>
    </View>
  );
}
//#endregion
