// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import type { TextProps } from "react-native";
import { Text } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import { cn } from "~/lib/style";
import { getFont } from "~/modules/customization/font/utils";

/** Styled `<Text />`. */
export function StyledText({
  className,
  style,
  bold,
  dim,
  ...props
}: TextProps & Partial<Record<"bold" | "dim", boolean>>) {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return (
    <Text
      className={cn(
        "text-left text-base text-onSurface",
        { "text-xs text-onSurfaceVariant": dim },
        className,
      )}
      style={[
        { fontFamily: getFont(primaryFont, { bold }) },
        bold && { fontWeight: primaryFont === "System" ? "bold" : undefined },
        style,
      ]}
      {...props}
    />
  );
}

/** Emphasize some text. */
export function Em({
  className,
  ...props
}: React.ComponentProps<typeof StyledText>) {
  return <StyledText bold className={cn("text-xs", className)} {...props} />;
}

//#region Translated Variants
/** `<StyledText />` that accepts a translated key instead of children. */
export function TStyledText({
  textKey,
  ...props
}: Omit<React.ComponentProps<typeof StyledText>, "children"> & {
  textKey: ParseKeys;
}) {
  const { t } = useTranslation();
  return <StyledText {...props}>{t(textKey)}</StyledText>;
}

/** `<Em />` that accepts a translated key instead of children. */
export function TEm({
  textKey,
  ...props
}: Omit<React.ComponentProps<typeof Em>, "children"> & {
  textKey: ParseKeys;
}) {
  const { t } = useTranslation();
  return <Em {...props}>{t(textKey)}</Em>;
}
//#endregion
