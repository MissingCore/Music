// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import type { TextProps as RNTextProps } from "react-native";
import { Text as RNText } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import { cva } from "~/lib/style";
import { getFont } from "~/modules/customization/font/utils";

const textStyle = cva({
  base: "text-left text-base text-onSurface",
  variants: {
    intent: {
      unset: null,
      accent: "text-4xl leading-tight",
      em: "text-xs",
      muted: "text-xs text-onSurfaceVariant",
    },
    uppercase: { true: "tracking-wider uppercase" },
  },
  defaultVariants: {
    intent: "unset",
    uppercase: false,
  },
});

export type TextVariants = VariantProps<typeof textStyle>;

interface TextProps extends RNTextProps, TextVariants {
  bold?: boolean;
}

export function Text({
  intent,
  uppercase,
  bold: _bold,
  className,
  style,
  ...props
}: TextProps) {
  const asAccent = intent === "accent";
  const bold = _bold ?? intent === "em";

  const fontFamily = usePreferenceStore(
    (s) => s[`${asAccent ? "accent" : "primary"}Font`],
  );

  return (
    <RNText
      {...props}
      className={textStyle({ intent, uppercase, className })}
      style={[
        {
          fontFamily: getFont(fontFamily, { headline: asAccent, bold }),
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
