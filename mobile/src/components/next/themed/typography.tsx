// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import type { TextProps as RNTextProps } from "react-native";
import { Text as RNText } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import { cn } from "~/lib/style";
import { getFont } from "~/modules/customization/font/utils";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/core/context";

const TextSizes = {
  xxs: "text-xxs",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
} as const;

export interface TextProps extends RNTextProps {
  accent?: boolean;
  bold?: boolean;
  center?: boolean;
  color?: AppColor;
  size?: keyof typeof TextSizes;
}

export function Text({
  accent,
  bold,
  center,
  color,
  size,
  className,
  style,
  ...props
}: TextProps) {
  const fontFamily = usePreferenceStore(
    (s) => s[`${accent ? "accent" : "primary"}Font`],
  );
  const textColor = useColor(color);

  return (
    <RNText
      {...props}
      className={cn(
        "text-left text-base",
        size && TextSizes[size],
        center && "text-center",
        className,
      )}
      style={[
        {
          color: textColor,
          fontFamily: getFont(fontFamily, { headline: accent, bold }),
          //? Setting a `fontWeight` on a custom font uses the bolded variant
          //? of the system font.
          fontWeight: bold && fontFamily === "System" ? "bold" : undefined,
        },
        style,
      ]}
    />
  );
}

export function TText({
  textKey,
  ...props
}: TextProps & { textKey: ParseKeys }) {
  const { t } = useTranslation();
  return <Text {...props}>{t(textKey)}</Text>;
}
