import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useMemo, useState } from "react";
import { View } from "react-native";
import type { ColorFormatsObject } from "reanimated-color-picker";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";
import { z } from "zod/mini";

import { db } from "~/db";
import { customThemes } from "../schema";

import { usePreferenceStore } from "~/stores/Preference/store";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { BorderRadius } from "~/constants/Styles";
import type { HexColor } from "~/lib/style";
import { wait } from "~/utils/promise";
import { Pressable } from "~/components/Base/Pressable";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { ExtendedTButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { Modal, ModalTemplate } from "~/components/Modal";
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
  const { offset, floatingContentProps } = useFloatingContent();
  const activeCustomThemeId = usePreferenceStore((s) => s.activeCustomThemeId);

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
      <ThemeForm bottomOffset={offset} />
      {props.mode === "edit" &&
      activeCustomThemeId !== props.initialData?.id ? (
        <DeleteWorkflow floatingContentProps={floatingContentProps} />
      ) : null}
    </FormStateProvider>
  );
}

//#region Theme Form
const FormInput = FormInputImpl<ThemeEntry>();

function ThemeForm({ bottomOffset }: { bottomOffset: number }) {
  const { data, setFields, isSubmitting } = useFormState();
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="gap-6 p-4"
    >
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
            disabled={isSubmitting}
            className="h-8 justify-center"
          >
            <Switch enabled={data.scheme === "dark"} />
          </Pressable>
        }
      />

      <View className="gap-2">
        {ThemeRoleOptions.map((role) => (
          <HexColorPicker key={role} field={role} />
        ))}
      </View>
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Color Picker
function HexColorPicker({ field }: { field: ThemeRole }) {
  const { data, setFields, isSubmitting } = useFormState();
  const [draftValue, setDraftValue] = useState<string>(data[field]);
  const [showPicker, setShowPicker] = useState(false);

  const savedValue = data[field];

  const onChange = (text: string) => {
    setDraftValue(text.toUpperCase());
    const normalized = normalizeHexColor(text);
    if (!normalized) return;
    setFields({ [field]: normalized });
  };

  const onPickerComplete = (colors: ColorFormatsObject) => {
    const normalized = normalizeHexColor(colors.hex);
    if (!normalized) return;
    onChange(normalized);
  };

  return (
    <View className="flex-1">
      <Pressable
        accessibilityLabel={`Pick ${field} color`}
        onPress={() => setShowPicker(true)}
        disabled={isSubmitting}
        className="min-h-14 flex-row items-center overflow-hidden rounded-sm border border-outline active:opacity-50"
      >
        <View
          className="aspect-square h-full"
          style={{ backgroundColor: savedValue }}
        />
        <View className="p-2">
          <Em>{field}</Em>
          <StyledText className="text-sm text-onSurfaceVariant">
            {savedValue}
          </StyledText>
        </View>
      </Pressable>

      <Modal visible={showPicker}>
        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-2">
            <Em>{field}</Em>
            <TextInput
              value={draftValue}
              onChangeText={onChange}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              className="h-6 min-h-0 w-15 rounded-xs border border-outline p-1 text-xs text-onSurfaceVariant"
              style={{ fontFamily: "GeistMono-Regular" }}
            />
          </View>

          <ColorPicker
            value={savedValue}
            onCompleteJS={onPickerComplete}
            thumbSize={20}
            sliderThickness={26}
            boundedThumb
            style={{ gap: 12 }}
          >
            <Panel1 style={{ borderRadius: BorderRadius.md }} />
            <HueSlider style={{ borderRadius: BorderRadius.full }} />
          </ColorPicker>

          <ExtendedTButton
            textKey="form.close"
            onPress={() => setShowPicker(false)}
            className="bg-surfaceContainer active:bg-surfaceContainerHigh"
          />
        </View>
      </Modal>
    </View>
  );
}
//#endregion

//#region Delete Workflow
function DeleteWorkflow({
  floatingContentProps,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [lastChance, setLastChance] = useState(false);
  const { data, isSubmitting, setIsSubmitting } = useFormState();

  const onDeletePressed = async () => {
    if (!data.id) return;
    setLastChance(false);
    setIsSubmitting(true);
    await wait(1);
    try {
      await db.delete(customThemes).where(eq(customThemes.id, data.id));
      queryClient.invalidateQueries({ queryKey: ["custom-themes"] });
      navigation.goBack();
    } catch {
      setLastChance(true);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <View {...floatingContentProps}>
        <ExtendedTButton
          textKey="form.delete"
          onPress={() => setLastChance(true)}
          disabled={lastChance || isSubmitting}
          className="bg-error active:bg-errorDim"
          textClassName="text-onError"
        />
      </View>
      <ModalTemplate
        visible={lastChance}
        titleKey="form.delete"
        topAction={{
          textKey: "form.confirm",
          onPress: onDeletePressed,
        }}
        bottomAction={{
          textKey: "form.cancel",
          onPress: () => setLastChance(false),
        }}
      />
    </>
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

export type ThemeEntry = z.infer<typeof ThemeEntrySchema>;

function useFormState() {
  return useFormStateContext<ThemeEntry>();
}
//#endregion

//#region Utils
/** Normalizes `#RGB` and `#RRGGBB` strings to uppercase `#RRGGBB`. */
function normalizeHexColor(value: string) {
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
