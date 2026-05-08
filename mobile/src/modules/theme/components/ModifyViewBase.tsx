import { toast } from "@missingcore/toast";
import { useNavigation } from "@react-navigation/native";
import { Fragment, useMemo, useState } from "react";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { wait } from "~/utils/promise";
import { Pressable } from "~/components/Base/Pressable";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { ExtendedTButton } from "~/components/Form/Button";
import { ModalTemplate } from "~/components/Modal";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { Switch } from "~/components/UI/Switch";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import { FormInputImpl } from "~/modules/form/FormState/FormInput";
import type { ColorRole, HexColor } from "../constants";
import { ColorRoleOptions, Themes } from "../constants";
import { readThemeFile } from "../helpers/backup";
import type { ThemeEntry } from "../helpers/zod";
import { ThemeEntrySchema } from "../helpers/zod";
import { deleteCustomTheme, revalidateCustomThemes } from "../queries";
import { ColorPickerInput } from "./ColorPickerInput";

function useFormState() {
  return useFormStateContext<ThemeEntry>();
}

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
        ColorRoleOptions.map((role) => [
          role,
          props.initialData?.[role] ?? Themes.light[role],
        ]),
      ) as Record<ColorRole, HexColor>),
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
        {ColorRoleOptions.map((role) => (
          <ColorPickerInput
            key={`${role}_${data._importGen}`}
            label={role}
            value={data[role]}
            onUpdateValue={(color) => setFields({ [role]: color })}
            disabled={isSubmitting}
          />
        ))}
      </View>
    </KeyboardAwareScrollView>
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
      setFields({ name, scheme, ...colors, _importGen: Date.now() });
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
  const [lastChance, setLastChance] = useState(false);
  const { data, isSubmitting, setIsSubmitting } = useFormState();

  const onDeletePressed = async () => {
    if (!data._id) return;
    setLastChance(false);
    setIsSubmitting(true);
    await wait(1);
    try {
      await deleteCustomTheme(data._id);
      revalidateCustomThemes();
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
