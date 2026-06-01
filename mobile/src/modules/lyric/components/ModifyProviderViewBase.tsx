import { z } from "zod/mini";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { Pressable } from "~/components/Base/Pressable";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { Switch } from "~/components/UI/Switch";
import { ZSchema } from "~/modules/form/utils";
import type { FABWorkflowConfig } from "~/modules/form/FormState";
import {
  FABWorkflow,
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import {
  ArrayFormInputImpl,
  FormInputImpl,
  TextareaImpl,
} from "~/modules/form/FormState/FormInput";

function useFormState() {
  return useFormStateContext<LyricProviderEntry>();
}

export function ModifyLyricProvierBase(props: {
  onSubmit: (data: LyricProviderEntry) => void | Promise<void>;
  initialData?: LyricProviderEntry;
  actionConfig?: FABWorkflowConfig<LyricProviderEntry>;
}) {
  const { offset, floatingContentProps } = useFloatingContent();

  return (
    <FormStateProvider
      schema={LyricProviderEntrySchema}
      initData={{
        name: props.initialData?.name ?? "",
        endpoint: props.initialData?.endpoint ?? "",
        isJSONResponse: props.initialData?.isJSONResponse ?? true,
        headers: props.initialData?.headers ?? "",
        traversedFields: props.initialData?.traversedFields ?? [],
      }}
      onSubmit={props.onSubmit}
    >
      <LyricProviderForm bottomOffset={offset} />
      {props.actionConfig ? (
        <FABWorkflow
          {...props.actionConfig}
          floatingContentProps={floatingContentProps}
        />
      ) : null}
    </FormStateProvider>
  );
}

//#region Lyric Provider Form
const FormInput = FormInputImpl<LyricProviderEntry>();
const ArrayFormInput = ArrayFormInputImpl<LyricProviderEntry>();
const Textarea = TextareaImpl<LyricProviderEntry>();

function LyricProviderForm({ bottomOffset }: { bottomOffset: number }) {
  const { data, setFields, isSubmitting } = useFormState();
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="gap-6 p-4"
    >
      <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
      <Textarea label="Endpoint" field="endpoint" oneLine />
      <ArrayFormInput label="Traversed Fields" field="traversedFields" />
      <SheetLabelAction
        label="isJSONResponse"
        RightElement={
          <Pressable
            onPress={() =>
              setFields((prev) => ({ isJSONResponse: !prev.isJSONResponse }))
            }
            disabled={isSubmitting}
            className="h-8 justify-center"
          >
            <Switch enabled={data.isJSONResponse} />
          </Pressable>
        }
      />
      <Textarea label="Headers" field="headers" />
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Schema
const LyricProviderEntrySchema = z.object({
  name: ZSchema.NonEmptyString,
  endpoint: z.httpUrl().check(z.trim(), z.minLength(1)),
  isJSONResponse: z.boolean(),
  headers: z.string(),
  traversedFields: z.array(ZSchema.NonEmptyString),
});

type LyricProviderEntry = z.infer<typeof LyricProviderEntrySchema>;
//#endregion
