// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  ClickActionProps,
  FlexWidgetStyle,
} from "react-native-android-widget";
import { FlexWidget } from "react-native-android-widget";

import { Styles } from "../constants/Styles";

/** Styling for a 1×1 cell. */
export function WidgetCell({
  size,
  style,
  ...props
}: ClickActionProps & {
  size: number;
  children: React.ReactNode;
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
        backgroundColor: Styles.color.background,
        // By default, shape is circular.
        borderRadius: 999,
        ...style,
      }}
      {...props}
    />
  );
}
