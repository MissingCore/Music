import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { useFormStateContext } from ".";

import type { KeysOfValue } from "~/utils/types";
import { FlatList } from "~/components/Base/List";
import { IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { RemovableItem } from "~/components/List/RemovableItem";
import { Em, TEm } from "~/components/Typography/StyledText";

//#region Label
export function InputLabel(props: {
  labelKey?: ParseKeys;
  label?: string;
  RightElement?: React.ReactNode;
}) {
  return (
    <View className="mb-1 min-h-8 flex-row items-center justify-between gap-4">
      {props.labelKey ? (
        <TEm textKey={props.labelKey} />
      ) : (
        <Em>{props.label}</Em>
      )}
      {props.RightElement}
    </View>
  );
}
//#endregion

//#region Text/Numeric Input
export function FormInputImpl<TData extends Record<string, any>>() {
  return function FormInput(props: {
    labelKey?: ParseKeys;
    label?: string;
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
        <InputLabel labelKey={props.labelKey} label={props.label} />
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
    labelKey?: ParseKeys;
    label?: string;
    field: KeysOfValue<TData, string[]>;
  }) {
    const { t } = useTranslation();
    const { data, setField, isSubmitting } = useFormState<TData>();

    const field = props.field;
    const values: string[] = data[field];

    return (
      <View>
        <InputLabel
          labelKey={props.labelKey}
          label={props.label}
          RightElement={
            <IconButton
              Icon={Add}
              accessibilityLabel={t("template.entryAdd", {
                name: props.labelKey ? t(props.labelKey) : props.label,
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
    labelKey?: ParseKeys;
    label?: string;
    field: KeysOfValue<TData, string>;
  }) {
    const { data, setField, isSubmitting } = useFormState<TData>();
    return (
      <View className="flex-1">
        <InputLabel labelKey={props.labelKey} label={props.label} />
        <TextInput
          editable={!isSubmitting}
          value={data[props.field]}
          onChangeText={(text) =>
            setField((prev) => ({ ...prev, [props.field]: text }))
          }
          multiline
          textAlignVertical="top"
          className="min-h-64 w-full rounded-sm border border-outline px-2 py-3"
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
