import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import type { ColorFormatsObject } from "reanimated-color-picker";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";
import { z } from "zod/mini";

import type { HexColor } from "~/lib/style";
import { Pressable } from "~/components/Base/Pressable";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { ExtendedTButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { Modal } from "~/components/Modal";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { Em, StyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import { ZSchema } from "~/modules/form/utils";
import { FormInputImpl } from "~/modules/form/FormState/FormInput";
import type { ThemeRole } from "../constants";
import { ThemeRoleOptions, Themes } from "../constants";

export function ModifyThemeBase(props: {
  onSubmit: (data: ThemeEntry) => void | Promise<void>;
  mode?: "create" | "edit";
  initialData?: Partial<ThemeEntry>;
}) {
  const initData = useMemo(
    () => ({
      id: props.initialData?.id ?? null,
      name: props.initialData?.name ?? "",
      scheme: props.initialData?.scheme ?? "light",
      ...(Object.fromEntries(
        ThemeRoleOptions.map((role) => [
          role,
          props.initialData?.[role] ?? Themes.light[role],
        ]),
      ) as Record<ThemeRole, HexColor>),
    }),
    [props.initialData],
  );

  return (
    <FormStateProvider
      schema={ThemeEntrySchema}
      initData={initData}
      onSubmit={props.onSubmit}
    >
      <ThemeForm />
    </FormStateProvider>
  );
}

//#region Theme Form
const FormInput = FormInputImpl<ThemeEntry>();

function ThemeForm() {
  const { data, setFields, isSubmitting } = useFormState();

  return (
    <KeyboardAwareScrollView contentContainerClassName="gap-6 p-4">
      <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
      <SheetLabelAction
        labelKey="feat.theme.extra.dark"
        RightElement={
          <Pressable
            onPress={() =>
              setFields((prev) => ({
                scheme: prev.scheme === "dark" ? "light" : "dark",
              }))
            }
            className="h-8 justify-center"
          >
            <Switch enabled={data.scheme === "dark"} />
          </Pressable>
        }
      />

      <View className="gap-3">
        {ThemeRoleOptions.map((role) => (
          <HexColorPicker
            key={role}
            label={role}
            value={data[role]}
            onChange={(value) => setFields({ [role]: value })}
            disabled={isSubmitting}
          />
        ))}
      </View>
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Color Picker
type HexColorPickerProps = {
  label: string;
  value: HexColor;
  onChange: (value: HexColor) => void;
  disabled?: boolean;
};

export function HexColorPicker({
  label,
  value,
  onChange,
  disabled,
}: HexColorPickerProps) {
  const [draftHex, setDraftHex] = useState<string>(value);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setDraftHex(value);
  }, [value]);

  const onChangeHex = (text: string) => {
    setDraftHex(text.toUpperCase());
    const normalized = normalizeHexColor(text);
    if (!normalized) return;
    onChange(normalized);
  };

  const onPickerComplete = (colors: ColorFormatsObject) => {
    const normalized = normalizeHexColor(colors.hex);
    if (!normalized) return;
    setDraftHex(normalized);
    onChange(normalized);
  };

  return (
    <View className="gap-2 rounded-sm border border-outline p-3">
      <View className="flex-row items-center justify-between gap-2">
        <Em>{label}</Em>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setShowPicker(true)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Pick ${label} color`}
          >
            <View
              className="size-6 rounded-xs border border-outline"
              style={{ backgroundColor: value }}
            />
          </Pressable>
          <StyledText className="text-xs text-onSurfaceVariant">
            {value}
          </StyledText>
        </View>
      </View>

      <TextInput
        editable={!disabled}
        value={draftHex}
        onChangeText={onChangeHex}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={7}
        className="w-full rounded-sm border border-outline px-2"
      />

      <Modal visible={showPicker}>
        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-2">
            <Em>{label}</Em>
            <StyledText className="text-xs text-onSurfaceVariant">
              {value}
            </StyledText>
          </View>

          <ColorPicker
            value={value}
            onCompleteJS={onPickerComplete}
            thumbSize={20}
            boundedThumb
          >
            <Panel1 style={{ borderRadius: 8, minHeight: 180 }} />
            <HueSlider style={{ marginTop: 10, borderRadius: 999 }} />
          </ColorPicker>

          <ExtendedTButton
            textKey="form.cancel"
            onPress={() => setShowPicker(false)}
          />
        </View>
      </Modal>
    </View>
  );
}
//#endregion

//#region Schema
const HexColorSchema = z.pipe(
  ZSchema.NonEmptyString,
  z.transform((str, ctx) => {
    const normalized = normalizeHexColor(str);
    if (normalized) return normalized;

    ctx.issues.push({
      code: "invalid_value",
      input: str,
      values: [str],
      message: "Expected a valid hex color.",
    });
    return z.NEVER;
  }),
);

const ColorRolesSchema = Object.fromEntries(
  ThemeRoleOptions.map((role) => [role, HexColorSchema]),
) as Record<ThemeRole, typeof HexColorSchema>;

const ThemeEntrySchema = z.object({
  // Additional context:
  id: z.nullable(z.string()),
  // Actual form fields:
  name: ZSchema.NonEmptyString,
  scheme: z.enum(["light", "dark"]),
  ...ColorRolesSchema,
});

type ThemeEntry = z.infer<typeof ThemeEntrySchema>;

function useFormState() {
  return useFormStateContext<ThemeEntry>();
}
//#endregion

//#region Utils
/** Normalizes `#RGB` and `#RRGGBB` strings to uppercase `#RRGGBB`. */
export function normalizeHexColor(value: string) {
  const raw = value.trim();
  const shortMatch = /^#([\da-fA-F]{3})$/.exec(raw);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1]!.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase() as HexColor;
  }

  if (!/^#([\da-fA-F]{6})$/.test(raw)) return null;
  return raw.toUpperCase() as HexColor;
}
//#endregion
