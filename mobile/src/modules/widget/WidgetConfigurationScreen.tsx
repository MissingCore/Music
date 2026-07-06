// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import type { WidgetConfigurationScreenProps } from "react-native-android-widget";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { MinimumAppProvider } from "~/navigation/providers/AppProvider";

import { isAudioBrowserSetUp } from "~/lib/react-native-audio-browser";
import { Pressable } from "~/components/Base/Pressable";
import { ModalActions } from "~/components/Modal";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { AccentText } from "~/components/Typography/AccentText";
import { Switch } from "~/components/UI/Switch";
import { ColorPickerInput } from "~/modules/customization/theme/components/ColorPickerInput";
import { DEFAULT_WIDGET_CONFIG } from "./constants/Config";
import { nameToWidget } from "./constants/Widgets";
import type { WidgetConfig } from "./types";
import { getWidgetData } from "./utils";
import {
  getWidgetConfig,
  getWidgetConfigKey,
  updateWidgetConfig,
} from "./utils/customize";

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
  const insets = useSafeAreaInsets();

  const widgetKey = getWidgetConfigKey(widgetInfo);

  const onSubmit = useCallback(
    async (config: WidgetConfig) => {
      try {
        await updateWidgetConfig(widgetKey, config);

        // Ensure customizations are applied to newly created widget.
        const widgetData = { ...widgetInfo, ...getWidgetData() };
        const shouldOpen = !(await isAudioBrowserSetUp());

        const Widget =
          nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];
        renderWidget(
          <Widget
            {...widgetData}
            stylingConfig={config}
            openApp={shouldOpen}
          />,
        );
      } catch (err) {
        console.log(err);
      } finally {
        setResult("ok");
      }
    },
    [widgetInfo, setResult, renderWidget, widgetKey],
  );

  const onCancel = useCallback(() => {
    setResult("cancel");
  }, [setResult]);

  return (
    <ListLayout
      contentContainerStyle={{
        paddingTop: insets.top + 64,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <AccentText>Customize Widget</AccentText>

      <WidgetConfigForm
        widgetKey={widgetKey}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </ListLayout>
  );
}

const SUPPORTED_COLORS = [
  "bgColor",
  "textColor",
  "mutedTextColor",
  "activeColor",
  "onActiveColor",
  "inactiveColor",
  "onInactiveColor",
] as const;

function WidgetConfigForm(props: {
  widgetKey: string;
  onSubmit: (config: WidgetConfig) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<WidgetConfig>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getWidgetConfig(props.widgetKey)
      .then(setData)
      .catch(() => setData({ ...DEFAULT_WIDGET_CONFIG }));
  }, [props.widgetKey]);

  if (data === undefined) return null;
  return (
    <>
      <SheetLabelAction
        label="Transparent"
        RightElement={
          <Pressable
            onPress={() =>
              setData((_prev) => {
                const prev = _prev as WidgetConfig;
                return { ...prev, transparent: !prev.transparent };
              })
            }
            disabled={isSubmitting}
            className="h-8 justify-center"
          >
            <Switch enabled={data.transparent} />
          </Pressable>
        }
      />

      <View className="gap-2">
        {SUPPORTED_COLORS.map((role) => (
          <ColorPickerInput
            key={role}
            label={role}
            value={data[role]}
            onUpdateValue={(color) =>
              setData((_prev) => {
                const prev = _prev as WidgetConfig;
                return { ...prev, [role]: color };
              })
            }
            disabled={isSubmitting}
          />
        ))}
      </View>

      <ModalActions
        topAction={{
          textKey: "form.confirm",
          onPress: () => {
            setIsSubmitting(true);
            props.onSubmit(data);
          },
        }}
        bottomAction={{ textKey: "form.cancel", onPress: props.onCancel }}
      />
    </>
  );
}
