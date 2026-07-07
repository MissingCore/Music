// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { HexColor, TextWidgetProps } from "react-native-android-widget";
import { TextWidget } from "react-native-android-widget";

export function WidgetText({
  text,
  style,
  maxLines = 1,
  color,
  fontSize,
  ...props
}: Omit<TextWidgetProps, "text"> & {
  text: string | null | undefined;
  color: HexColor;
  fontSize: number;
}) {
  return (
    <TextWidget
      text={text ?? "—"}
      truncate="END"
      allowFontScaling={false}
      maxLines={maxLines}
      style={{ fontFamily: "Inter-Regular", ...style, fontSize, color }}
      {...props}
    />
  );
}
