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
        "min-h-12 items-center justify-center gap-2 rounded-md bg-surfaceContainerLowest p-4 disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
});
//#endregion

//#region Extended Translated
export type ExtendedTButtonProps = Omit<RippleProps, "children"> & {
  textKey: ParseKeys;
  /** **Note:** Text will be left-aligned if provided. */
  LeftElement?: React.ReactNode;
  RightElement?: React.ReactNode;
  textClassName?: string;
};

export const ExtendedTButton = memo(function ExtendedTButton(
  props: ExtendedTButtonProps,
) {
  return (
    <Button
      {...props}
      className={cn(
        "flex-row",
        { "justify-start": !!props.LeftElement },
        props.className,
      )}
    >
      {props.LeftElement}
      <TEm
        textKey={props.textKey}
        className={cn(
          "shrink text-sm",
          { "text-center": !props.LeftElement },
          props.textClassName,
        )}
      />
      {props.RightElement}
    </Button>
  );
});
//#endregion
