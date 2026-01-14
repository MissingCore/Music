import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { z } from "zod/mini";

import { db } from "~/db";
import { lyrics } from "~/db/schema";

import { Check } from "~/resources/icons/Check";
import { queries as q } from "~/queries/keyStore";
import { FormStateProvider, useFormStateContext } from "~/hooks/useFormState";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { wait } from "~/utils/promise";
import { ScrollablePresets } from "~/components/Defaults";
import { ExtendedTButton } from "~/components/Form/Button";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { ModalTemplate } from "~/components/Modal";
import { TEm } from "~/components/Typography/StyledText";

type ModifyLyricBaseProps = {
  onSubmit: (data: LyricEntry) => void | Promise<void>;
  mode?: "create" | "edit";
  initialData?: Omit<LyricEntry, "mode">;
};

export function ModifyLyricBase(props: ModifyLyricBaseProps) {
  const { offset, ...rest } = useFloatingContent();

  const RenderedWorkflow = useMemo(
    () => (props.mode === "edit" ? DeleteWorkflow : Fragment),
    [props.mode],
  );

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
      <LyricForm bottomOffset={offset} />
      <RenderedWorkflow {...rest} />
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
          size="sm"
        />
      )}
    />
  );
}
//#endregion

//#region Lyric Form
function LyricForm({ bottomOffset }: { bottomOffset: number }) {
  const { data, setField, isSubmitting } = useFormState();

  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      {...ScrollablePresets}
      // Remove 24px as `KeyboardAwareScrollView` adds an element at the
      // end of the ScrollView, causing an additional application of `gap`.
      contentContainerStyle={{ paddingBottom: bottomOffset - 24 }}
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

//#region Delete Workflow
function DeleteWorkflow({
  floatingRef,
  wrapperStyling,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [lastChance, setLastChance] = useState(false);
  const { data, isSubmitting, setIsSubmitting } = useFormState();

  const onDelete = async () => {
    if (!data.id) return;
    setLastChance(false);
    setIsSubmitting(true);
    await wait(1);
    try {
      await db.delete(lyrics).where(eq(lyrics.id, data.id));
      queryClient.invalidateQueries({ queryKey: q.lyrics._def });
      navigation.goBack();
      navigation.goBack();
    } catch {
      setLastChance(true);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <View ref={floatingRef} {...wrapperStyling}>
        <ExtendedTButton
          textKey="form.delete"
          onPress={() => setLastChance(true)}
          disabled={lastChance || isSubmitting}
          className="bg-error active:bg-errorDim"
          textClassName="text-onError"
        />
      </View>
      <ModalTemplate
        visible={lastChance}
        titleKey="form.delete"
        topAction={{
          textKey: "form.confirm",
          onPress: onDelete,
        }}
        bottomAction={{
          textKey: "form.cancel",
          onPress: () => setLastChance(false),
        }}
      />
    </>
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
