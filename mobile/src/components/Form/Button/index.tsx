// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { memo } from "react";

import { cn } from "~/lib/style";
import type { RippleProps } from "../../Base/Pressable";
import { Ripple } from "../../Base/Pressable";
import { TEm } from "../../Typography/StyledText";

//#region Default
export const Button = memo(function Button({
  className,
  ...props
}: RippleProps) {
  return (
    <Ripple
      className={cn(
        "bg-surfaceContainerLowest p-4 disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
});
//#endregion

//#region Extended Translated
const ButtonTheme = {
  primary: { bg: "bg-primary", text: "text-onPrimary" },
  secondary: { bg: "bg-secondary", text: "text-onSecondary" },
  error: { bg: "bg-error", text: "text-onError" },
} as const;

export type ExtendedTButtonProps = Omit<RippleProps, "children"> & {
  textKey: ParseKeys;
  /** **Note:** Text will be left-aligned if provided. */
  Leading?: React.ReactNode;
  Trailing?: React.ReactNode;
  textClassName?: string;
  theme?: keyof typeof ButtonTheme;
};

export const ExtendedTButton = memo(function ExtendedTButton(
  props: ExtendedTButtonProps,
) {
  const { bg, text } = props.theme ? ButtonTheme[props.theme] : {};
  return (
    <Button
      rippleColor={props.theme ? `${props.theme}Dim` : undefined}
      {...props}
      className={cn(
        "flex-row",
        { "justify-start": !!props.Leading },
        bg,
        props.className,
      )}
    >
      {props.Leading}
      <TEm
        textKey={props.textKey}
        className={cn(
          "shrink text-sm",
          { "text-center": !props.Leading },
          text,
          props.textClassName,
        )}
      />
      {props.Trailing}
    </Button>
  );
});
//#endregion
