// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  ClickActionProps,
  FlexWidgetStyle,
  HexColor,
} from "react-native-android-widget";
import { FlexWidget } from "react-native-android-widget";

/** Styling for a 1×1 cell. */
export function WidgetCell({
  size,
  bgColor,
  style,
  ...props
}: ClickActionProps & {
  size: number;
  children: React.ReactNode;
  bgColor: HexColor;
  style?: FlexWidgetStyle;
}) {
  return (
    <FlexWidget
      style={{
        overflow: "hidden",
        height: size,
        width: size,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
        // By default, shape is circular.
        borderRadius: 999,
        ...style,
      }}
      {...props}
    />
  );
}
