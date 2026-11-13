// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import * as v from "valibot";
import { useShallow } from "zustand/react/shallow";

import { useLyricStore } from "../core/store";
import {
  createLyricProvider,
  deleteLyricProvider,
  updateLyricProvider,
} from "../core/actions";
import { LyricProviderEndpointPlaceholders } from "../core/constants";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { Button } from "~/components/Form/Button";
import { SwitchInput } from "~/components/Form/Switch";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { Em } from "~/components/Typography/StyledText";
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
import { FormSchema } from "~/modules/form/utils";

type Props = StaticScreenProps<{ providerId?: string }>;

export default function LyricProviderForm({
  route: {
    params: { providerId },
  },
}: Props) {
  const navigation = useNavigation();
  const currentProvider = useLyricStore(
    useShallow((s) =>
      s.providers.find((provider) => provider.id === providerId),
    ),
  );
  const { offset, floatingContentProps } = useFloatingContent();

  //#region Create Flow
  const onCreate = useCallback(
    (entry: LyricProviderEntry) => {
      createLyricProvider(entry);
      navigation.goBack();
    },
    [navigation],
  );
  //#endregion

  //#region Modify Flow
  const deleteAction = useMemo<FABWorkflowConfig<LyricProviderEntry>>(
    () => ({
      label: "form.delete",
      action: async () => {
        if (!providerId)
          throw new Error("Attempting to delete provider that doesn't exist.");
        deleteLyricProvider(providerId);
        navigation.goBack();
      },
      danger: true,
    }),
    [navigation, providerId],
  );

  const onUpdate = useCallback(
    async (entry: LyricProviderEntry) => {
      if (!providerId)
        throw new Error("Attempting to update provider that doesn't exist.");
      updateLyricProvider(providerId, entry);
      navigation.goBack();
    },
    [navigation, providerId],
  );
  //#endregion

  const providerExists = Boolean(currentProvider);

  return (
    <FormStateProvider
      schema={LyricProviderEntrySchema}
      initData={{
        name: currentProvider?.name ?? "",
        endpoint: currentProvider?.endpoint ?? "",
        isJSONResponse: currentProvider?.isJSONResponse ?? true,
        headers: currentProvider?.headers ?? "",
        traversedFields: currentProvider?.traversedFields ?? [],
      }}
      onSubmit={providerExists ? onUpdate : onCreate}
    >
      <ScreenOptions title={providerExists ? "form.edit" : "form.create"} />
      <FormContents bottomOffset={offset} />
      {providerExists ? (
        <FABWorkflow
          {...deleteAction}
          floatingContentProps={floatingContentProps}
        />
      ) : null}
    </FormStateProvider>
  );
}

//#region Form Contents
const FormInput = FormInputImpl<LyricProviderEntry>();
const ArrayFormInput = ArrayFormInputImpl<LyricProviderEntry>();
const Textarea = TextareaImpl<LyricProviderEntry>();

function FormContents({ bottomOffset }: { bottomOffset: number }) {
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
const LyricProviderEntrySchema = v.object({
  name: FormSchema.NonEmptyString,
  endpoint: v.pipe(
    v.string(),
    v.trim(),
    v.url(),
    v.check(
      (endpoint) => /^https?:\/\//i.test(endpoint),
      "Expected an HTTP or HTTPS URL.",
    ),
  ),
  isJSONResponse: v.boolean(),
  headers: v.string(),
  traversedFields: v.array(FormSchema.NonEmptyString),
});

type LyricProviderEntry = v.InferOutput<typeof LyricProviderEntrySchema>;
//#endregion

function useFormState() {
  return useFormStateContext<LyricProviderEntry>();
}
