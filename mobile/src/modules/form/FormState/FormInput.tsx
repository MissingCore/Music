// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import type { TranslationKeyOrString } from "~/modules/i18n/core";
import { useMaybeT } from "~/modules/i18n/core";
import { useFormStateContext } from ".";

import { cn } from "~/lib/style";
import type { KeysOfValue } from "~/utils/types";
import { FlatList } from "~/components/Base/List";
import { IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { RemovableItem } from "~/components/List/RemovableItem";
import { Em } from "~/components/Typography/StyledText";

//#region Label
export function InputLabel(props: {
  label: TranslationKeyOrString;
  Trailing?: React.ReactNode;
}) {
  const t = useMaybeT();
  return (
    <View className="mb-1 min-h-8 flex-row items-center justify-between gap-4">
      <Em>{t(props.label)}</Em>
      {props.Trailing}
    </View>
  );
}
//#endregion

//#region Text/Numeric Input
export function FormInputImpl<TData extends Record<string, any>>() {
  return function FormInput(props: {
    label: TranslationKeyOrString;
    field: KeysOfValue<TData, string | number | null>;
    numeric?: boolean;
  }) {
    const { data, setField, isSubmitting } = useFormState<TData>();

    const value = data[props.field];
    const onChange = (text: string) => {
      const realNum = text.trim() === "" ? null : +text;
      setField((prev) => ({
        ...prev,
        [props.field]: props.numeric
          ? Number.isNaN(realNum)
            ? prev[props.field] // Use prior value if we get `NaN`.
            : realNum
          : text,
      }));
    };

    return (
      <View className="flex-1">
        <InputLabel label={props.label} />
        <TextInput
          inputMode={props.numeric ? "numeric" : undefined}
          editable={!isSubmitting}
          value={value !== null ? String(value) : ""}
          onChangeText={onChange}
          className="w-full rounded-sm border border-outline p-2"
        />
      </View>
    );
  };
}
//#endregion

//#region Array Input
export function ArrayFormInputImpl<TData extends Record<string, any>>() {
  return function ArrayFormInput(props: {
    label: TranslationKeyOrString;
    field: KeysOfValue<TData, string[]>;
  }) {
    const t = useMaybeT();
    const { data, setField, isSubmitting } = useFormState<TData>();

    const field = props.field;
    const values: string[] = data[field];

    return (
      <View>
        <InputLabel
          label={props.label}
          Trailing={
            <IconButton
              icon="add"
              accessibilityLabel={t("template.entryAdd", {
                name: t(props.label),
              })}
              onPress={() =>
                setField((prev) => ({ ...prev, [field]: [...prev[field], ""] }))
              }
              disabled={isSubmitting}
              size="xs"
            />
          }
        />
        <FlatList
          data={values}
          keyExtractor={(_, index) => `${index}`}
          renderItem={({ item: value, index: row }) => (
            <RemovableItem
              label={value}
              onRemove={() =>
                setField((prev) => ({
                  ...prev,
                  [field]: (prev[field] as string[]).filter(
                    (_, idx) => idx !== row,
                  ),
                }))
              }
              disableRemove={isSubmitting}
            >
              <TextInput
                editable={!isSubmitting}
                value={value}
                onChangeText={(text) =>
                  setField((prev) => ({
                    ...prev,
                    [field]: (prev[field] as string[]).map((val, idx) =>
                      idx === row ? text : val,
                    ),
                  }))
                }
                className="shrink grow rounded-sm border border-outline p-2"
              />
            </RemovableItem>
          )}
          scrollEnabled={false}
          contentContainerClassName="gap-2"
        />
      </View>
    );
  };
}
//#endregion

//#region Textarea
export function TextareaImpl<TData extends Record<string, any>>() {
  return function Textarea(props: {
    label: TranslationKeyOrString;
    field: KeysOfValue<TData, string>;
    oneLine?: boolean;
  }) {
    const { data, setField, isSubmitting } = useFormState<TData>();
    return (
      <View className="flex-1">
        <InputLabel label={props.label} />
        <TextInput
          editable={!isSubmitting}
          value={data[props.field]}
          onChangeText={(_text) =>
            setField((prev) => {
              let text = _text;
              if (props.oneLine) text = text.replace(/\r?\n|\r/g, "");
              return { ...prev, [props.field]: text };
            })
          }
          multiline
          textAlignVertical="top"
          //? Don't display an "Enter" key.
          submitBehavior={props.oneLine ? "blurAndSubmit" : undefined}
          className={cn("w-full rounded-sm border border-outline px-2 py-3", {
            "min-h-64": !props.oneLine,
          })}
        />
      </View>
    );
  };
}
//#endregion

//#region Internal
function useFormState<TData extends Record<string, any>>() {
  return useFormStateContext<TData>();
}
//#endregion
