import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { Fragment, useMemo, useState } from "react";
import { View } from "react-native";
import { z } from "zod/mini";

import { db } from "~/db";
import { lyrics } from "~/db/schema";

import { queries as q } from "~/queries/keyStore";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { wait } from "~/utils/promise";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { ExtendedTButton } from "~/components/Form/Button";
import { ModalTemplate } from "~/components/Modal";
import { ZSchema } from "~/modules/form/utils";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import {
  FormInputImpl,
  TextareaImpl,
} from "~/modules/form/FormState/FormInput";

export function ModifyLyricBase(props: {
  onSubmit: (data: LyricEntry) => void | Promise<void>;
  mode?: "create" | "edit";
  initialData?: LyricEntry;
}) {
  const { offset, floatingContentProps } = useFloatingContent();

  const RenderedWorkflow = useMemo(
    () => (props.mode === "edit" ? DeleteWorkflow : Fragment),
    [props.mode],
  );

  return (
    <FormStateProvider
      schema={LyricEntrySchema}
      initData={{
        id: props.initialData?.id ?? null,
        name: props.initialData?.name ?? "",
        lyrics: props.initialData?.lyrics ?? "",
      }}
      onSubmit={props.onSubmit}
    >
      <LyricForm bottomOffset={offset} />
      <RenderedWorkflow floatingContentProps={floatingContentProps} />
    </FormStateProvider>
  );
}

//#region Lyric Form
const FormInput = FormInputImpl<LyricEntry>();
const Textarea = TextareaImpl<LyricEntry>();

function LyricForm({ bottomOffset }: { bottomOffset: number }) {
  return (
    <KeyboardAwareScrollView
      // Remove 24px as `KeyboardAwareScrollView` adds an element at the
      // end of the ScrollView, causing an additional application of `gap`.
      contentContainerStyle={{ paddingBottom: bottomOffset - 24 }}
      contentContainerClassName="gap-6 p-4"
    >
      <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
      <Textarea labelKey="feat.lyrics.title" field="lyrics" />
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Delete Workflow
function DeleteWorkflow({
  floatingContentProps,
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
      <View {...floatingContentProps}>
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
const LyricEntrySchema = z.object({
  // Additional context:
  id: z.nullable(z.string()),
  // Actual form fields:
  name: ZSchema.NonEmptyString,
  lyrics: ZSchema.NonEmptyString,
});

type LyricEntry = z.infer<typeof LyricEntrySchema>;

function useFormState() {
  return useFormStateContext<LyricEntry>();
}
//#endregion
