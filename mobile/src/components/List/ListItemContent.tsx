import type { ParseKeys } from "i18next";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useTheme } from "~/hooks/useTheme";

import type { VariantColor } from "~/lib/style";
import { cn } from "~/lib/style";
import { StyledText } from "../Typography/StyledText";

export type ListItemContentProps = (
  | { labelText: string; labelTextKey?: never }
  | { labelText?: never; labelTextKey: ParseKeys }
) & {
  supportingText?: string;
  /** **Note:** Label text will be larger if no supporting text is provided. */
  LeftElement?: React.ReactNode;
  RightElement?: React.ReactNode;
  /** If the text shouldn't be truncated to a line. */
  _overflow?: boolean;
  /** Use a different color with a `Variant` type for the text. */
  _textColor?: VariantColor;
  _labelTextClassName?: string;
  _supportingTextClassName?: string;
};

export const ListItemContent = memo(function ListItemContent(
  props: ListItemContentProps,
) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <>
      {props.LeftElement}
      <View className="shrink grow gap-0.5">
        <StyledText
          numberOfLines={props._overflow ? undefined : 1}
          style={
            props._textColor ? { color: theme[props._textColor] } : undefined
          }
          className={cn(
            "text-sm",
            { "text-base": !!props.LeftElement && !props.supportingText },
            props._labelTextClassName,
          )}
        >
          {props.labelTextKey ? t(props.labelTextKey) : props.labelText}
        </StyledText>
        {props.supportingText ? (
          <StyledText
            numberOfLines={props._overflow ? undefined : 1}
            dim
            style={
              props._textColor
                ? { color: theme[`${props._textColor}Variant`] }
                : undefined
            }
            className={props._supportingTextClassName}
          >
            {props.supportingText}
          </StyledText>
        ) : null}
      </View>
      {props.RightElement}
    </>
  );
});
