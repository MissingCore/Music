import { toast } from "@missingcore/toast";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { Fragment, useMemo, useState } from "react";
import { View } from "react-native";
import type { ColorFormatsObject } from "reanimated-color-picker";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";

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
import { FormInputImpl } from "~/modules/form/FormState/FormInput";
import type { ThemeRole } from "../constants";
import { ThemeRoleOptions, Themes } from "../constants";
import { readThemeFile } from "../helpers/backup";
import { normalizeHexColor } from "../helpers/color";
import type { ThemeEntry } from "../helpers/zod";
import { ThemeEntrySchema } from "../helpers/zod";

export function ModifyThemeBase(props: {
  onSubmit: (data: ThemeEntry) => void | Promise<void>;
  mode?: "create" | "edit";
  initialData?: Partial<ThemeEntry>;
}) {
  const { offset, floatingContentProps } = useFloatingContent();
  const activeCustomThemeId = usePreferenceStore((s) => s.activeCustomThemeId);

  const initData = useMemo(
    () => ({
      _id: props.initialData?._id ?? null,
      _importGen: null,
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

  const RenderedWorkflow = useMemo(() => {
    if (props.mode === "edit") {
      if (activeCustomThemeId === props.initialData?._id) return Fragment;
      return DeleteWorkflow;
    }
    return ImportWorkflow;
  }, [props.mode, activeCustomThemeId, props.initialData?._id]);

  return (
    <FormStateProvider
      schema={ThemeEntrySchema}
      initData={initData}
      onSubmit={props.onSubmit}
    >
      <ThemeForm bottomOffset={offset} />
      <RenderedWorkflow floatingContentProps={floatingContentProps} />
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
          <HexColorPicker key={`${role}_${data._importGen}`} field={role} />
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

//#region Import Workflow
function ImportWorkflow({
  floatingContentProps,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
  const { setFields, isSubmitting, setIsSubmitting } = useFormState();

  const onImport = async () => {
    setIsSubmitting(true);
    try {
      const { name, scheme, colors } = await readThemeFile();
      toast.t("feat.backup.extra.importSuccess");
      await wait(100);
      setFields({ name, scheme, ...colors });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View {...floatingContentProps}>
      <ExtendedTButton
        textKey="feat.backup.extra.import"
        onPress={onImport}
        disabled={isSubmitting}
        className="bg-secondary active:bg-secondaryDim"
        textClassName="text-onSecondary"
      />
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
    if (!data._id) return;
    setLastChance(false);
    setIsSubmitting(true);
    await wait(1);
    try {
      await db.delete(customThemes).where(eq(customThemes.id, data._id));
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

function useFormState() {
  return useFormStateContext<ThemeEntry>();
}
