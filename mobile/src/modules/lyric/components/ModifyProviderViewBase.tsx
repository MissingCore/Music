// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from "zod/mini";
import { useState } from "react";
import { View } from "react-native";

import { LyricProviderEndpointPlaceholders } from "../core/constants";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { Button } from "~/components/Form/Button";
import { SwitchInput } from "~/components/Form/Switch";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { Em } from "~/components/Typography/StyledText";
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

  //#region Placeholder Helper
  const [isEndpointInputFocused, setIsEndpointInputFocused] = useState(false);
  const [inputSelection, setInputSelection] = useState({ start: 0, end: 0 });

  const insertPlaceholder = (placeholder: string) => {
    if (!isEndpointInputFocused) return;
    const { start, end } = inputSelection;
    // Insert/replace placeholder at current cursor position/range..
    setFields({
      endpoint:
        data.endpoint.slice(0, start) + placeholder + data.endpoint.slice(end),
    });
    // Update cursor position to sit right after inserted placeholder.
    const newCursor = start + placeholder.length;
    setInputSelection({ start: newCursor, end: newCursor });
  };
  //#endregion

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps={isEndpointInputFocused ? "always" : undefined}
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="gap-6 p-4"
    >
      <FormInput label="feat.trackMetadata.extra.name" field="name" />
      <Textarea
        label="Endpoint"
        field="endpoint"
        oneLine
        selection={inputSelection}
        onSelectionChange={(e) => setInputSelection(e.nativeEvent.selection)}
        onFocus={() => setIsEndpointInputFocused(true)}
        onBlur={() => setIsEndpointInputFocused(false)}
      />
      <View className="-mt-4 flex-row flex-wrap gap-1.5">
        {LyricProviderEndpointPlaceholders.map((value) => (
          <Button
            key={value}
            onPress={() => insertPlaceholder(value)}
            disabled={isSubmitting || !isEndpointInputFocused}
            className="min-h-0 rounded-full px-3 py-1.5"
          >
            <Em>{value}</Em>
          </Button>
        ))}
      </View>

      <ArrayFormInput label="Traversed Fields" field="traversedFields" />
      <SheetLabelAction
        label="isJSONResponse"
        Trailing={
          <SwitchInput
            enabled={data.isJSONResponse}
            onPress={() =>
              setFields((prev) => ({ isJSONResponse: !prev.isJSONResponse }))
            }
            disabled={isSubmitting}
          />
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
  endpoint: z.httpUrl().check(z.trim()),
  isJSONResponse: z.boolean(),
  headers: z.string(),
  traversedFields: z.array(ZSchema.NonEmptyString),
});

type LyricProviderEntry = z.infer<typeof LyricProviderEntrySchema>;
//#endregion
