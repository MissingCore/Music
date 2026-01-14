import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { z } from "zod/mini";

import { Check } from "~/resources/icons/Check";
import { FormStateProvider, useFormStateContext } from "~/hooks/useFormState";

import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { ScrollablePresets } from "~/components/Defaults";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { TEm } from "~/components/Typography/StyledText";

type ModifyLyricBaseProps = {
  onSubmit: (data: LyricEntry) => void | Promise<void>;
  mode?: "create" | "edit";
  initialData?: Omit<LyricEntry, "mode">;
};

export function ModifyLyricBase(props: ModifyLyricBaseProps) {
  return (
    <FormStateProvider
      schema={LyricEntrySchema}
      initData={{
        mode: props.mode === "edit" ? "edit" : "create",
        id: props.initialData?.id ?? null,
        name: props.initialData?.name ?? "",
        lyrics: props.initialData?.lyrics ?? "",
      }}
      onSubmit={props.onSubmit}
    >
      <ScreenConfig />
      <LyricForm />
    </FormStateProvider>
  );
}

//#region Screen Configuration
function ScreenConfig() {
  const { t } = useTranslation();
  const { data, canSubmit, isSubmitting, onSubmit } = useFormState();
  return (
    <ScreenOptions
      title={`form.${data.mode}`}
      // Hacky solution to disable the back button when submitting.
      headerLeft={isSubmitting ? () => undefined : undefined}
      headerRight={() => (
        <FilledIconButton
          Icon={Check}
          accessibilityLabel={t("form.apply")}
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
        />
      )}
    />
  );
}
//#endregion

//#region Lyric Form
function LyricForm() {
  const { data, setField, isSubmitting } = useFormState();

  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      {...ScrollablePresets}
      // Remove 24px as `KeyboardAwareScrollView` adds an element at the
      // end of the ScrollView, causing an additional application of `gap`.
      contentContainerStyle={{ paddingBottom: -24 }}
      contentContainerClassName="gap-6 p-4"
    >
      <View className="flex-1">
        <TEm textKey="feat.trackMetadata.extra.name" dim />
        <TextInput
          editable={!isSubmitting}
          value={data.name}
          onChangeText={(text) => setField((prev) => ({ ...prev, name: text }))}
          className="w-full border-b border-outline"
        />
      </View>

      <View className="flex-1">
        <TEm textKey="feat.lyrics.title" dim />
        <TextInput
          editable={!isSubmitting}
          value={data.lyrics}
          onChangeText={(text) =>
            setField((prev) => ({ ...prev, lyrics: text }))
          }
          multiline
          numberOfLines={16}
          textAlignVertical="top"
          className="min-h-64 w-full border-b border-outline py-3"
        />
      </View>
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Schema
const NonEmptyStringSchema = z.string().check(z.trim(), z.minLength(1));

const LyricEntrySchema = z.object({
  // Additional context:
  mode: z.enum(["create", "edit"]),
  id: z.nullable(z.string()),
  // Actual form fields:
  name: NonEmptyStringSchema,
  lyrics: NonEmptyStringSchema,
});

type LyricEntry = z.infer<typeof LyricEntrySchema>;

function useFormState() {
  return useFormStateContext<LyricEntry>();
}
//#endregion
