// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";
import type { WidgetConfigurationScreenProps } from "react-native-android-widget";

import { ResizableNowPlayingWidget } from "./ResizableNowPlayingWidget";

import { ModalActions } from "~/components/Modal";

export function WidgetConfigurationScreen({
  widgetInfo,
  setResult,
  renderWidget,
}: WidgetConfigurationScreenProps) {
  return (
    <View className="bg-surface p-4">
      <ModalActions
        topAction={{
          textKey: "form.confirm",
          onPress: () => setResult("ok"),
        }}
        bottomAction={{
          textKey: "form.cancel",
          onPress: () => setResult("cancel"),
        }}
      />
    </View>
  );
}
