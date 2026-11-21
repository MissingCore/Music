// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";

import { usePreferenceStore } from "~/stores/Preference/store";
import { getFont, useColor } from "~/_next/context/theme-context";

import type { AppColor, FontSize } from "~/_next/constants/theme";
import { cn } from "~/_next/utils/style";
import type { TextProps as BaseTextProps } from "./primitives/text";
import { Text as BaseText } from "./primitives/text";

const TEXT_SIZE: Record<FontSize, `text-${FontSize}`> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "4xl": "text-4xl",
};

export interface TextProps extends BaseTextProps {
  accent?: boolean;
  bold?: boolean;
  center?: boolean;
  color?: AppColor;
  size?: FontSize;
}

export function Text({
  accent = false,
  bold = false,
  center = false,
  color = "text",
  size = "base",
  className,
  style,
  ...props
}: TextProps) {
  const textColor = useColor(color);
  const fontStyles = usePreferenceStore(
    useShallow((s) => {
      const fontFamily = s[`${accent ? "accent" : "primary"}Font`];
      return {
        fontFamily: getFont(fontFamily, { headline: accent, bold }),
        //? Setting a `fontWeight` on a custom font uses the bolded variant
        //? of the system font.
        fontWeight: bold && fontFamily === "System" ? "bold" : undefined,
      } as const;
    }),
  );

  return (
    <BaseText
      {...props}
      className={cn(
        "text-left",
        TEXT_SIZE[size],
        center && "text-center",
        className,
      )}
      style={[{ color: textColor }, fontStyles, style]}
    />
  );
}

export function TText({
  textKey,
  ...props
}: Omit<TextProps, "children"> & { textKey: ParseKeys }) {
  const { t } = useTranslation();
  return <Text {...props}>{t(textKey)}</Text>;
}
