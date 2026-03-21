import { toast } from "@missingcore/toast";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { z } from "zod/mini";

import { queries as q } from "~/data/keyStore";
import { deleteLyric } from "~/data/lyric/api";

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
import { readLyricFile } from "../helpers/readLyricFile";

export function ModifyLyricBase(props: {
  onSubmit: (data: LyricEntry) => void | Promise<void>;
  mode?: "create" | "edit";
  initialData?: LyricEntry;
}) {
  const { offset, floatingContentProps } = useFloatingContent();

  const RenderedWorkflow = useMemo(
    () => (props.mode === "edit" ? DeleteWorkflow : ImportWorkflow),
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
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="gap-6 p-4"
    >
      <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
      <Textarea labelKey="feat.lyrics.title" field="lyrics" />
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Import Workflow
function ImportWorkflow({
  floatingContentProps,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
  const { setFields, isSubmitting, setIsSubmitting } = useFormState();

  const onImport = async () => {
    setIsSubmitting(true);
    try {
      const { name, contents } = await readLyricFile();
      toast.t("feat.backup.extra.importSuccess");
      await wait(100);
      setFields({ name, lyrics: contents });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View {...floatingContentProps}>
      <ExtendedTButton
        textKey="feat.backup.extra.import"
        onPress={onImport}
        disabled={isSubmitting}
        className="bg-secondary active:bg-secondaryDim"
        textClassName="text-onSecondary"
      />
    </View>
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
      await deleteLyric(data.id);
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
