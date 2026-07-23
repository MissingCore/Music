// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { View } from "react-native";

import { cn } from "~/lib/style";
import type { VariantColor } from "~/modules/customization/theme/core/constants";
import { useTheme } from "~/modules/customization/theme/hooks";
import type { RipplePressProps } from "../Base/Pressable";
import { Ripple } from "../Base/Pressable";
import { StyledText } from "../Typography/StyledText";

export type ListItemProps = ListItemSlotsProps &
  RipplePressProps & {
    className?: string;
    style?: StyleProp<ViewStyle>;
  };

export const ListItem = memo(function StandardListItem(props: ListItemProps) {
  const Wrapper = useMemo(
    () => (!props.onPress ? View : Ripple),
    [props.onPress],
  );
  return (
    <Wrapper
      {...props}
      className={cn(
        "min-h-12 flex-row items-center gap-2 rounded-xs",
        props.className,
      )}
    >
      <ListItemSlots {...props} />
    </Wrapper>
  );
});

//#region List Item Slots
interface ListItemSlotsProps {
  /** Will be larger if `supportingText` is omitted. */
  labelText: ParseKeys | (string & {});
  supportingText?: string;

  Leading?: React.ReactNode;
  Trailing?: React.ReactNode;

  /** Whether text will be constrained to a single line. */
  _overflow?: boolean;
  /** Use a different color for the text. */
  _textColor?: VariantColor;
  _labelTextClassName?: string;
  _labelTextStyle?: StyleProp<TextStyle>;
}

const ListItemSlots = memo(function ListItemSlots(props: ListItemSlotsProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const lineCount = props._overflow ? undefined : 1;
  const [labelColor, supportingColor] = props._textColor
    ? [theme[props._textColor], theme[`${props._textColor}Variant`]]
    : [];

  return (
    <>
      {props.Leading}
      <View className="shrink grow gap-0.5">
        <StyledText
          numberOfLines={lineCount}
          style={[labelColor && { color: labelColor }, props._labelTextStyle]}
          className={cn(
            "text-sm",
            { "text-base": !!props.Leading && !props.supportingText },
            props._labelTextClassName,
          )}
        >
          {/* @ts-expect-error - If the key doesn't exist, then the string is outputted. */}
          {t(props.labelText)}
        </StyledText>
        {props.supportingText ? (
          <StyledText
            numberOfLines={lineCount}
            dim
            style={supportingColor ? { color: supportingColor } : undefined}
          >
            {props.supportingText}
          </StyledText>
        ) : null}
      </View>
      {props.Trailing}
    </>
  );
});
//#endregion
