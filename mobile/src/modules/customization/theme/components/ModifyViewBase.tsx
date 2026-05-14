import { useMemo } from "react";
import { View } from "react-native";
import { z } from "zod/mini";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { Pressable } from "~/components/Base/Pressable";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { Switch } from "~/components/UI/Switch";
import type { FABWorkflowConfig } from "~/modules/form/FormState";
import {
  FABWorkflow,
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import { FormInputImpl } from "~/modules/form/FormState/FormInput";
import { ZSchema } from "~/modules/form/utils";
import { ColorPickerInput } from "./ColorPickerInput";
import type { ColorRole, HexColor } from "../core/constants";
import { ColorRoleOptions, Themes } from "../core/constants";
import { ColorRoleZodMap } from "../core/utils";

function useFormState() {
  return useFormStateContext<ThemeEntry>();
}

export function ModifyThemeBase(props: {
  onSubmit: (data: ThemeEntry) => void | Promise<void>;
  initialData?: Partial<ThemeEntry>;
  actionConfig?: FABWorkflowConfig<ThemeEntry>;
}) {
  const { offset, floatingContentProps } = useFloatingContent();

  const initData = useMemo(
    () => ({
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

  return (
    <FormStateProvider
      schema={ThemeEntrySchema}
      initData={initData}
      onSubmit={props.onSubmit}
    >
      <ThemeForm bottomOffset={offset} />
      {props.actionConfig ? (
        <FABWorkflow
          {...props.actionConfig}
          floatingContentProps={floatingContentProps}
        />
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

//#region Schema
const ThemeEntrySchema = z.object({
  // Additional context:
  _importGen: z.nullable(z.number()),
  // Actual form fields:
  name: ZSchema.NonEmptyString,
  scheme: z.enum(["light", "dark"]),
  ...ColorRoleZodMap,
});

export type ThemeEntry = z.infer<typeof ThemeEntrySchema>;
//#endregion
