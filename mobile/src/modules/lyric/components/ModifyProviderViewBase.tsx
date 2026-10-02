// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from "zod/mini";
import { cn } from "~/lib/style";

import { useRef, useState } from "react";
import { View, Text, TextInputProps } from "react-native";
import { useTranslation } from "react-i18next";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { Pressable } from "~/components/Base/Pressable";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { SwitchInput } from "~/components/Form/Switch";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
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

import { ENDPOINT_TEMPLATES } from "../core/constants";

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
  const { t } = useTranslation();

  const { data, setFields, isSubmitting } = useFormState();

  const [isEndpointTextAreaFocused, setIsEndpointTextAreaFocused] =
    useState(false);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [selection, setSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);

  // Insert the template value endpoint text area.
  const insertTemplateToEndpointTextArea = (char: string) => {
    // If the focus is not on the endpoint text area,
    // then we need not insert the values.
    if (!isEndpointTextAreaFocused) return;
    
    char = "%" + char + "%";
    const currentText = data.endpoint || "";
    const { start, end } = selectionRef.current;

    // Insert character at current cursor position (or replace selected text).
    const updatedText =
      currentText.slice(0, start) + char + currentText.slice(end);

    setFields((prev) => ({
      ...prev,
      endpoint: updatedText,
    }));

    // Update cursor position to sit right after the newly inserted character.
    const newCursor = start + char.length;
    selectionRef.current = { start: newCursor, end: newCursor };
    setSelection({ start: newCursor, end: newCursor });
  };

  const handleSelectionChange: TextInputProps["onSelectionChange"] = (e) => {
    const sel = e.nativeEvent.selection;
    // Keep ref updated synchronously
    selectionRef.current = sel;
    setSelection(sel);
  };

  // Check if we are submitting or
  // if the end point the text area is not in the focus
  // then we need to disable the template buttons.
  const isTemplateButtonDisabled = isSubmitting || !isEndpointTextAreaFocused;

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="always"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="gap-6 p-4"
    >
      <FormInput label="feat.trackMetadata.extra.name" field="name" />
      <Textarea
        label="Endpoint"
        field="endpoint"
        oneLine
        selection={selection}
        onSelectionChange={handleSelectionChange}
        onFocus={() => setIsEndpointTextAreaFocused(true)}
        onBlur={() => setIsEndpointTextAreaFocused(false)}
      />
      <View className="flex-row flex-wrap justify-between gap-y-2">
        {ENDPOINT_TEMPLATES.map(({ label, value }) => (
          <Pressable
            key={t(label)}
            className="min-h-10 w-[49%] items-center justify-center rounded-md bg-neutral-200 active:opacity-70"
            onPressIn={() => insertTemplateToEndpointTextArea(value)}
            disabled={isTemplateButtonDisabled}
          >
            <Text
              className={cn("text-base font-semibold", {
                "text-neutral-800": !isTemplateButtonDisabled,
                "text-neutral-400": isTemplateButtonDisabled, // Grey color when disabled
              })}
            >
              {t(label)}
            </Text>
          </Pressable>
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
