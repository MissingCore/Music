// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { View } from "react-native";
import * as v from "valibot";

import { FormSchema } from "~/modules/form/utils";
import type { FormActionConfig } from "~/modules/form/Form";
import { Form, useFormAction, useFormContext } from "~/modules/form/Form";
import { createTypedFormInputs } from "~/modules/form/FormInput";
import { ColorPickerInput } from "./ColorPickerInput";
import type { ColorRole, HexColor } from "../core/constants";
import { ColorRoleOptions, Themes } from "../core/constants";
import { ColorRoleSchemaMap } from "../core/utils";

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
    <Form.Provider
      type={Boolean(props.initialData) ? "edit" : "create"}
      schema={ThemeEntrySchema}
      initData={initData}
      onSubmit={props.onSubmit}
    >
      <ThemeFormToolbar actionConfig={props.actionConfig} />
      <FormContents />
    </Form.Provider>
  );
}

//#region Toolbar
function ThemeFormToolbar(props: {
  actionConfig?: FormActionConfig<ThemeEntry>;
}) {
  const FormAction = useFormAction(props.actionConfig);
  return <Form.Toolbar>{FormAction}</Form.Toolbar>;
}
//#endregion

//#region Form Contents
const FormInput = createTypedFormInputs<ThemeEntry>();

function FormContents() {
  const { data, setFields, isSubmitting } = useFormContext<ThemeEntry>();
  return (
    <Form.Container>
      <Form.Title />
      <FormInput.Text label="feat.trackMetadata.extra.name" field="name" />
      <FormInput.Switch label="feat.theme.extra.dark" field="isDark" />
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
    </Form.Container>
  );
}
//#endregion

//#region Schema
const ThemeEntrySchema = v.object({
  // Additional context:
  _importGen: v.nullable(v.number()),
  // Actual form fields:
  name: FormSchema.NonEmptyString,
  isDark: v.boolean(),
  ...ColorRoleSchemaMap,
});

type ThemeEntry = v.InferOutput<typeof ThemeEntrySchema>;
//#endregion
