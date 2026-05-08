import { z } from "zod/mini";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { ZSchema } from "~/modules/form/utils";
import type { FABWorkflowConfig } from "~/modules/form/FormState";
import { FABWorkflow, FormStateProvider } from "~/modules/form/FormState";
import {
  FormInputImpl,
  TextareaImpl,
} from "~/modules/form/FormState/FormInput";

export function ModifyLyricBase(props: {
  actionConfig: FABWorkflowConfig<LyricEntry>;
  onSubmit: (data: LyricEntry) => void | Promise<void>;
  initialData?: LyricEntry;
}) {
  const { offset, floatingContentProps } = useFloatingContent();

  return (
    <FormStateProvider
      schema={LyricEntrySchema}
      initData={{
        name: props.initialData?.name ?? "",
        lyrics: props.initialData?.lyrics ?? "",
      }}
      onSubmit={props.onSubmit}
    >
      <LyricForm bottomOffset={offset} />
      <FABWorkflow
        {...props.actionConfig}
        floatingContentProps={floatingContentProps}
      />
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

//#region Schema
const LyricEntrySchema = z.object({
  // Actual form fields:
  name: ZSchema.NonEmptyString,
  lyrics: ZSchema.NonEmptyString,
});

type LyricEntry = z.infer<typeof LyricEntrySchema>;
//#endregion
