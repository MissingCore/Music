// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { WidgetConfigurationScreenProps } from "react-native-android-widget";
import * as v from "valibot";

import { MinimumAppProvider } from "~/navigation/providers/AppProvider";

import { isAudioBrowserSetUp } from "~/lib/react-native-audio-browser";
import { Text } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
import { HexColorSchema } from "~/modules/customization/theme/core/utils";
import { ColorPickerInput } from "~/modules/customization/theme/components/ColorPickerInput";
import { Form, useFormContext } from "~/modules/form/Form";
import { createTypedFormInputs } from "~/modules/form/FormInput";
import { DEFAULT_WIDGET_CONFIG } from "./constants/Config";
import type { WidgetName } from "./impl";
import { nameToWidget } from "./impl";
import { getWidgetData } from "./utils";
import { getWidgetConfigKey } from "./utils/customize";
import { getWidgetConfig, updateWidgetConfig } from "./utils/customize.core";

export function WidgetConfigurationScreen(
  props: WidgetConfigurationScreenProps,
) {
  return (
    <MinimumAppProvider>
      <WidgetConfigurationScreenPropsImpl {...props} />
    </MinimumAppProvider>
  );
}

function WidgetConfigurationScreenPropsImpl({
  widgetInfo,
  setResult,
  renderWidget,
}: WidgetConfigurationScreenProps) {
  const [widgetData, setWidgetData] = useState<WidgetConfigEntry>();
  const widgetKey = getWidgetConfigKey(widgetInfo);

  useEffect(() => {
    getWidgetConfig(widgetKey)
      .then(setWidgetData)
      .catch(() => setWidgetData({ ...DEFAULT_WIDGET_CONFIG }));
  }, [widgetKey]);

  const onSubmit = useCallback(
    async (config: WidgetConfigEntry) => {
      try {
        await updateWidgetConfig(widgetKey, config);

        // Ensure customizations are applied to newly created widget.
        const widgetData = { ...widgetInfo, ...getWidgetData() };
        const shouldOpen = !(await isAudioBrowserSetUp());

        const Widget = nameToWidget[widgetInfo.widgetName as WidgetName];
        renderWidget(
          <Widget {...widgetData} config={config} openApp={shouldOpen} />,
        );
      } catch (err) {
        console.log(err);
      }
      setResult("ok");
    },
    [widgetInfo, setResult, renderWidget, widgetKey],
  );

  const onCancel = useCallback(() => {
    setResult("cancel");
  }, [setResult]);

  if (widgetData === undefined) return null;
  return (
    <Form.Provider
      //? This property is irrelevant for this form.
      type="edit"
      schema={WidgetConfigEntrySchema}
      initData={widgetData}
      onSubmit={onSubmit}
      promptUnsavedChanges={false}
    >
      <FormContents onCancel={onCancel} />
    </Form.Provider>
  );
}

//#region Form Contents
const FormInput = createTypedFormInputs<WidgetConfigEntry>();

function FormContents(props: { onCancel: VoidFunction }) {
  const { t } = useTranslation();
  const { data, setFields, isSubmitting, onSubmit } =
    useFormContext<WidgetConfigEntry>();
  return (
    <Form.Container contentContainerClassName="pb-safe-offset-4">
      <Text accent className="leading-tight">
        Customize Widget
      </Text>
      <FormInput.Switch label="Transparent" field="transparent" />
      <View className="gap-2">
        {SUPPORTED_COLORS.map((role) => (
          <ColorPickerInput
            key={role}
            label={role}
            value={data[role]}
            onUpdateValue={(color) => setFields({ [role]: color })}
            disabled={isSubmitting}
          />
        ))}
      </View>

      <View className="flex-row gap-2">
        <ActionButton
          label={t("form.cancel")}
          onPress={props.onCancel}
          disabled={isSubmitting}
          filled={false}
          className="flex-1"
        />
        <ActionButton
          label={t("form.confirm")}
          onPress={onSubmit}
          disabled={isSubmitting}
          intent="inverse"
          className="flex-1"
        />
      </View>
    </Form.Container>
  );
}
//#endregion

//#region Schema
const SUPPORTED_COLORS = [
  "bgColor",
  "textColor",
  "mutedTextColor",
  "activeColor",
  "onActiveColor",
  "inactiveColor",
  "onInactiveColor",
] as const;

const WidgetConfigEntrySchema = v.object({
  transparent: v.boolean(),
  ...(Object.fromEntries(
    SUPPORTED_COLORS.map((role) => [role, HexColorSchema]),
  ) as Record<(typeof SUPPORTED_COLORS)[number], typeof HexColorSchema>),
});

type WidgetConfigEntry = v.InferOutput<typeof WidgetConfigEntrySchema>;
//#endregion
