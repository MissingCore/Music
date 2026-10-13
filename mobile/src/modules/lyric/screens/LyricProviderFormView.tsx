// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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

import { cn } from "~/lib/style";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { Em } from "~/components/Typography/StyledText";
import { Button } from "~/components/next/base/button";
import { IconButton } from "~/components/next/base/button-icon";
import { SwitchInput } from "~/components/next/base/switch";
import { ConfirmAction } from "~/components/next/composed/confirm-action";
import {
  Toolbar,
  ToolbarScreenOffset,
} from "~/components/next/composed/toolbar";
import { ZSchema } from "~/modules/form/utils";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState/next";
import {
  ArrayFormInputImpl,
  FormInputImpl,
  TextareaImpl,
} from "~/modules/form/FormState/FormInputNext";

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
      <FormToolbar onDelete={providerExists ? onDelete : undefined} />
      <Form />
    </FormStateProvider>
  );
}

//#region Toolbar
function FormToolbar(props: { onDelete?: VoidFunction }) {
  const { t } = useTranslation();
  const { canSubmit, isSubmitting, onSubmit, setIsSubmitting } = useFormState();
  return (
    <Toolbar>
      <Toolbar.Actions>
        <Toolbar.Back />
        {props.onDelete ? (
          <ConfirmAction prompt={[t("form.delete")]}>
            <IconButton
              icon="delete"
              accessibilityLabel={t("form.delete")}
              onPress={() => {
                setIsSubmitting(true);
                props.onDelete?.();
                setIsSubmitting(false);
              }}
              disabled={isSubmitting}
              intent="error"
              _iconColor="error"
            />
          </ConfirmAction>
        ) : null}
      </Toolbar.Actions>
      <Toolbar.FAB
        icon="save"
        accessibilityLabel={t("form.apply")}
        onPress={onSubmit}
        disabled={!canSubmit || isSubmitting}
        intent="inverse"
      />
    </Toolbar>
  );
}
//#endregion

//#region Lyric Form
const FormInput = FormInputImpl<LyricProviderEntry>();
const ArrayFormInput = ArrayFormInputImpl<LyricProviderEntry>();
const Textarea = TextareaImpl<LyricProviderEntry>();

function Form() {
  const { data, isSubmitting, setFields } = useFormState();

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
      contentContainerClassName={cn("gap-6 p-4", ToolbarScreenOffset)}
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

//#region Internal
function useFormState() {
  return useFormStateContext<LyricProviderEntry>();
}
//#endregion
