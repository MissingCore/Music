// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { View } from "react-native";
import { z } from "zod/mini";

import { cn } from "~/lib/style";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { ToolbarScreenOffset } from "~/components/next/composed/toolbar";
import type { FormActionConfig } from "~/modules/form/FormState";
import {
  FormStateProvider,
  FormTitle,
  FormToolbar,
  useFormAction,
  useFormStateContext,
} from "~/modules/form/FormState";
import {
  FormInputImpl,
  SwitchInputImpl,
} from "~/modules/form/FormState/FormInput";
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
  actionConfig?: FormActionConfig<ThemeEntry>;
}) {
  const initData = useMemo(
    () => ({
      _importGen: null,
      name: props.initialData?.name ?? "",
      isDark: props.initialData?.isDark ?? false,
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
      type={Boolean(props.initialData) ? "edit" : "create"}
      schema={ThemeEntrySchema}
      initData={initData}
      onSubmit={props.onSubmit}
    >
      <ThemeFormToolbar actionConfig={props.actionConfig} />
      <ThemeForm />
    </FormStateProvider>
  );
}

//#region Toolbar
function ThemeFormToolbar(props: {
  actionConfig?: FormActionConfig<ThemeEntry>;
}) {
  const FormAction = useFormAction(props.actionConfig);
  return <FormToolbar>{FormAction}</FormToolbar>;
}
//#endregion

//#region Theme Form
const FormInput = FormInputImpl<ThemeEntry>();
const SwitchInput = SwitchInputImpl<ThemeEntry>();

function ThemeForm() {
  const { data, setFields, isSubmitting } = useFormState();
  return (
    <KeyboardAwareScrollView
      contentContainerClassName={cn("gap-6 p-4", ToolbarScreenOffset)}
    >
      <FormTitle />
      <FormInput label="feat.trackMetadata.extra.name" field="name" />
      <SwitchInput label="feat.theme.extra.dark" field="isDark" />
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
  isDark: z.boolean(),
  ...ColorRoleZodMap,
});

type ThemeEntry = z.infer<typeof ThemeEntrySchema>;
//#endregion
