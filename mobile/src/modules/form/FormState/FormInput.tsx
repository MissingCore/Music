import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { Close } from "~/resources/icons/Close";
import { useFormStateContext } from ".";

import { cn } from "~/lib/style";
import type { KeysOfValue } from "~/utils/types";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { TextInput } from "~/components/Form/Input";
import { TEm } from "~/components/Typography/StyledText";

//#region Text/Numeric Input
export function FormInputImpl<TData extends Record<string, any>>() {
  return function FormInput(props: {
    labelKey: ParseKeys;
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
        <TEm textKey={props.labelKey} dim />
        <TextInput
          inputMode={props.numeric ? "numeric" : undefined}
          editable={!isSubmitting}
          value={value !== null ? String(value) : ""}
          onChangeText={onChange}
          className="w-full border-b border-outline"
        />
      </View>
    );
  };
}
//#endregion

//#region Array Input
export function ArrayFormInputImpl<TData extends Record<string, any>>() {
  return function ArrayFormInput(props: {
    labelKey: ParseKeys;
    field: KeysOfValue<TData, string[]>;
  }) {
    const { t } = useTranslation();
    const { data, setField, isSubmitting } = useFormState<TData>();

    const field = props.field;
    const value: string[] = data[field];

    return (
      <View>
        <TEm textKey={props.labelKey} dim />
        {value.map((value, row) => (
          <View
            key={row}
            className={cn("flex-row items-center", { "mt-2": row > 0 })}
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
              className="shrink grow border-b border-outline"
            />
            <IconButton
              Icon={Close}
              accessibilityLabel={t("template.entryRemove", { name: value })}
              onPress={() =>
                setField((prev) => ({
                  ...prev,
                  [field]: (prev[field] as string[]).filter(
                    (_, idx) => idx !== row,
                  ),
                }))
              }
              disabled={isSubmitting}
              className="shrink-0"
            />
          </View>
        ))}
        <FilledIconButton
          Icon={Add}
          accessibilityLabel=""
          onPress={() =>
            setField((prev) => ({ ...prev, [field]: [...prev[field], ""] }))
          }
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-secondary active:bg-secondaryDim"
          _iconColor="onSecondary"
        />
      </View>
    );
  };
}
//#endregion

//#region Textarea
export function TextareaImpl<TData extends Record<string, any>>() {
  return function Textarea(props: {
    labelKey: ParseKeys;
    field: KeysOfValue<TData, string>;
  }) {
    const { data, setField, isSubmitting } = useFormState<TData>();
    return (
      <View className="flex-1">
        <TEm textKey={props.labelKey} dim />
        <TextInput
          editable={!isSubmitting}
          value={data[props.field]}
          onChangeText={(text) =>
            setField((prev) => ({ ...prev, [props.field]: text }))
          }
          multiline
          numberOfLines={16}
          textAlignVertical="top"
          className="min-h-64 w-full border-b border-outline py-3"
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
