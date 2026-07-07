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
  height = "match_parent",
  width = "match_parent",
  transparent,
  style,
  stylingConfig,
  ...props
}: Omit<
  WidgetDefinition<
    ClickActionProps & {
      children: React.ReactNode;
      transparent?: boolean;
      style?: FlexWidgetStyle;
    }
  >,
  "height" | "width"
> & { height?: number | "match_parent"; width?: number | "match_parent" }) {
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
