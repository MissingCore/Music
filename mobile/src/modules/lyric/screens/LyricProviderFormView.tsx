// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { z } from "zod/mini";
import { useShallow } from "zustand/react/shallow";

import { useLyricStore } from "../core/store";
import {
  createLyricProvider,
  deleteLyricProvider,
  updateLyricProvider,
} from "../core/actions";
import { LyricProviderEndpointPlaceholders } from "../core/constants";

import { Em } from "~/components/Typography/StyledText";
import { Button } from "~/components/next/base/button";
import { ZSchema } from "~/modules/form/utils";
import { Form, useFormAction, useFormContext } from "~/modules/form/FormState";
import { createTypedFormInputs } from "~/modules/form/FormState/FormInput";

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
  const onDelete = useCallback(() => {
    if (!providerId)
      throw new Error("Attempting to delete provider that doesn't exist.");
    deleteLyricProvider(providerId);
    navigation.goBack();
  }, [navigation, providerId]);

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
    <Form.Provider
      type={providerExists ? "edit" : "create"}
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
      <LyricFormToolbar onDelete={providerExists ? onDelete : undefined} />
      <FormContents />
    </Form.Provider>
  );
}

//#region Toolbar
function LyricFormToolbar(props: { onDelete?: VoidFunction }) {
  const FormAction = useFormAction(
    props.onDelete
      ? {
          label: "form.delete",
          action: props.onDelete,
          actionConfig: {
            icon: "delete",
            intent: "error",
            _iconColor: "error",
          },
          requiresConfirmation: true,
        }
      : undefined,
  );
  return <Form.Toolbar>{FormAction}</Form.Toolbar>;
}
//#endregion

//#region Form Contents
const FormInput = createTypedFormInputs<LyricProviderEntry>();

function FormContents() {
  const { data, setFields, isSubmitting } =
    useFormContext<LyricProviderEntry>();

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
    <Form.Container
      keyboardShouldPersistTaps={isEndpointInputFocused ? "always" : undefined}
    >
      <Form.Title />
      <FormInput.Text label="feat.trackMetadata.extra.name" field="name" />
      <FormInput.TextArea
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
      <FormInput.Array label="Traversed Fields" field="traversedFields" />
      <FormInput.Switch label="isJSONResponse" field="isJSONResponse" />
      <FormInput.TextArea label="Headers" field="headers" />
    </Form.Container>
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
