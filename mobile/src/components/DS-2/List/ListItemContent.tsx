import type { ParseKeys } from "i18next";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { TextColor } from "~/lib/style";
import { cn } from "~/lib/style";
import { StyledText } from "../../Typography/StyledText";

export type ListItemContentProps = (
  | { labelText: string; labelTextKey?: never }
  | { labelText?: never; labelTextKey: ParseKeys }
) & {
  supportingText?: string;
  /** If the text shouldn't be truncated to a line. */
  _overflow?: boolean;
  /** Use a fixed text color instead of one that changes based on the theme. */
  _textColor?: TextColor;
  LeftElement?: React.ReactNode;
  RightElement?: React.ReactNode;
};

export const ListItemContent = memo(function ListItemContent(
  props: ListItemContentProps,
) {
  const { t } = useTranslation();
  return (
    <>
      {props.LeftElement}
      <View className="shrink grow gap-0.5">
        <StyledText
          numberOfLines={props._overflow ? undefined : 1}
          className={cn("text-sm", props._textColor)}
        >
          {props.labelTextKey ? t(props.labelTextKey) : props.labelText}
        </StyledText>
        {props.supportingText ? (
          <StyledText
            numberOfLines={props._overflow ? undefined : 1}
            className={cn("text-xs opacity-60", props._textColor)}
          >
            {props.supportingText}
          </StyledText>
        ) : null}
      </View>
      {props.RightElement}
    </>
  );
});
