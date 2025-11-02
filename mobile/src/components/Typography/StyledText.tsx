import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import type { TextProps } from "react-native";
import { Text } from "react-native";

import { useUserPreferenceStore } from "~/stores/UserPreference/store";

import { cn, getFont } from "~/lib/style";

/** Styled `<Text />`. */
export function StyledText({
  className,
  style,
  bold,
  center,
  dim,
  ...props
}: TextProps & Partial<Record<"bold" | "center" | "dim", boolean>>) {
  const primaryFont = useUserPreferenceStore((s) => s.primaryFont);
  return (
    <Text
      className={cn(
        "text-left text-base text-foreground",
        {
          "text-center": center,
          "text-xs text-foreground/60": dim,
        },
        className,
      )}
      style={[{ fontFamily: getFont(primaryFont, bold) }, style]}
      {...props}
    />
  );
}

/** Emphasize some text. */
export function Em({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof StyledText>, "children"> & {
  children: string;
}) {
  return (
    <StyledText bold className={cn("text-xxs", className)} {...props}>
      {children.toLocaleUpperCase()}
    </StyledText>
  );
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
