// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  ClickActionProps,
  FlexWidgetStyle,
} from "react-native-android-widget";
import { FlexWidget } from "react-native-android-widget";

import type { WidgetDefinition } from "../types";
import { Styles } from "../constants/Styles";

/**
 * General layout for widget while also center-aligning it on devices where
 * a `1x1` area isn't necessarily square.
 */
export function WidgetBaseLayout({
  height,
  width,
  transparent,
  style,
  stylingConfig,
  ...props
}: WidgetDefinition<
  ClickActionProps & {
    children: React.ReactNode;
    transparent?: boolean;
    style?: FlexWidgetStyle;
  }
>) {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FlexWidget
        style={{
          overflow: "hidden",
          height,
          width,
          backgroundColor:
            transparent || stylingConfig.transparent
              ? Styles.color.transparent
              : stylingConfig.bgColor,
          borderRadius: Styles.radius,
          ...style,
        }}
        {...props}
      />
    </FlexWidget>
  );
}
