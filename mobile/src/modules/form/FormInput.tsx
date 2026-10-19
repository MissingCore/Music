// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import type { TranslationKeyOrString } from "~/modules/i18n/core";
import { useMaybeT } from "~/modules/i18n/core";
import { useFormContext } from "./Form";

import { cn } from "~/lib/style";
import type { KeysOfValue } from "~/utils/types";
import { FlatList } from "~/components/Base/List";
import { IconButton } from "~/components/next/base/button-icon";
import type { InputProps } from "~/components/next/base/input";
import { TextInput } from "~/components/next/base/input";
import { SwitchInput } from "~/components/next/base/switch";
import { Text } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";

//#region Label
export function InputLabel(props: {
  label: TranslationKeyOrString;
  Trailing?: React.ReactNode;
  className?: string;
}) {
  const t = useMaybeT();
  return (
    <View
      className={cn(
        "mb-2 flex-row items-center justify-between gap-4",
        props.className,
      )}
    >
      <Text intent="em">{t(props.label)}</Text>
      {props.Trailing}
    </View>
  );
}
//#endregion

export function createTypedFormInputs<TData extends Record<string, any>>() {
  interface FormInputProps<TResult> {
    label: TranslationKeyOrString;
    //? The `& string` is to strip the `number | symbol` from the type.
    field: KeysOfValue<TData, TResult> & string;
  }

  /** Helper to simplify getting the outputs. */
  function useFormProperties<TResult>(field: string) {
    const { data, setField, isSubmitting } = useFormContext<TData>();
    return {
      value: data[field] as TResult,
      setField: (cb: (prevValue: TResult) => TResult) =>
        setField((prev) => ({ ...prev, [field]: cb(prev[field]) })),
      isSubmitting,
    };
  }

  const baseInputStyles = "w-full rounded-lg border border-outline p-2";

  //#region Text
  function TextFormInput({ label, field }: FormInputProps<string>) {
    const { value, setField, isSubmitting } = useFormProperties<string>(field);
    return (
      <View className="shrink grow">
        <InputLabel label={label} />
        <TextInput
          editable={!isSubmitting}
          value={value}
          onChangeText={(text) => setField(() => text)}
          className={baseInputStyles}
        />
      </View>
    );
  }
  //#endregion

  //#region Numeric
  function Numeric({ label, field }: FormInputProps<number | null>) {
    const { value, setField, isSubmitting } = useFormProperties<number | null>(
      field,
    );
    return (
      <View className="shrink grow">
        <InputLabel label={label} />
        <TextInput
          inputMode="numeric"
          editable={!isSubmitting}
          value={value !== null ? String(value) : ""}
          onChangeText={(text) => {
            const asRealNum = text.trim() === "" ? null : +text;
            // Use prior value if we get `NaN`.
            setField((prevValue) =>
              Number.isNaN(asRealNum) ? prevValue : asRealNum,
            );
          }}
          className={baseInputStyles}
        />
      </View>
    );
  }
  //#endregion

  //#region Array
  function Array({ label, field }: FormInputProps<string[]>) {
    const t = useMaybeT();
    const { value, setField, isSubmitting } =
      useFormProperties<string[]>(field);
    return (
      <View className="shrink grow">
        <InputLabel
          label={label}
          Trailing={
            <IconButton
              icon="add"
              accessibilityLabel={t("template.entryAdd", { name: t(label) })}
              onPress={() => setField((prevValue) => [...prevValue, ""])}
              disabled={isSubmitting}
              size="xs"
            />
          }
        />
        <FlatList
          data={value}
          keyExtractor={(_, index) => `${index}`}
          renderItem={({ item, index: row }) => (
            <View className="flex-row items-center gap-1">
              <IconButton
                icon="do-not-disturb-on"
                accessibilityLabel={t("template.entryRemove", { name: item })}
                onPress={() =>
                  setField((prevValue) =>
                    prevValue.filter((_, idx) => idx !== row),
                  )
                }
                disabled={isSubmitting}
                size="xs"
              />
              <TextInput
                editable={!isSubmitting}
                value={item}
                onChangeText={(text) =>
                  setField((prevVal) =>
                    prevVal.map((val, idx) => (idx === row ? text : val)),
                  )
                }
                className={cn(baseInputStyles, "shrink grow")}
              />
            </View>
          )}
          scrollEnabled={false}
          contentContainerClassName="gap-1.5"
        />
      </View>
    );
  }
  //#endregion

  //#region Text Area
  function TextArea(
    props: {
      field: KeysOfValue<TData, string> & string;
      label?: TranslationKeyOrString;
      oneLine?: boolean;
    } & Pick<
      InputProps,
      "selection" | "onSelectionChange" | "onFocus" | "onBlur" | "className"
    >,
  ) {
    const { value, setField, isSubmitting } = useFormProperties<string>(
      props.field,
    );

    const renderedInput = (
      <TextInput
        editable={!isSubmitting}
        value={value}
        onChangeText={(text) =>
          setField(() => (props.oneLine ? text.replace(/\r?\n|\r/g, "") : text))
        }
        multiline
        textAlignVertical="top"
        //? Don't display an "Enter" key.
        submitBehavior={props.oneLine ? "blurAndSubmit" : undefined}
        selection={props.selection}
        onSelectionChange={props.onSelectionChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        className={cn(baseInputStyles, "py-3", props.className)}
      />
    );

    if (!props.label) return renderedInput;
    return (
      <View className="shrink grow">
        <InputLabel label={props.label} />
        {renderedInput}
      </View>
    );
  }
  //#endregion

  //#region Switch
  function Switch({ label, field }: FormInputProps<boolean>) {
    const { value, setField, isSubmitting } = useFormProperties<boolean>(field);
    return (
      <View className="min-h-8 flex-row items-center justify-between gap-2">
        <Marquee>
          <InputLabel label={label} className="mb-0" />
        </Marquee>
        <SwitchInput
          enabled={value}
          onPress={() => setField((prevValue) => !prevValue)}
          disabled={isSubmitting}
        />
      </View>
    );
  }
  //#endregion

  return { Text: TextFormInput, Numeric, Array, TextArea, Switch };
}
