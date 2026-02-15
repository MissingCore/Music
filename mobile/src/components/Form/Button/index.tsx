import type { ParseKeys } from "i18next";
import { memo } from "react";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { cn } from "~/lib/style";
import { TEm } from "../../Typography/StyledText";

//#region Default
export const Button = memo(function Button({
  className,
  ...props
}: PressableProps) {
  return (
    <Pressable
      className={cn(
        "min-h-12 items-center justify-center gap-2 rounded-md bg-surfaceContainerLowest p-4",
        "active:bg-surfaceContainerLow disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
});
//#endregion

//#region Extended Translated
export type ExtendTButtonProps = Omit<PressableProps, "children"> & {
  textKey: ParseKeys;
  /** **Note:** Text will be left-aligned if provided. */
  LeftElement?: React.ReactNode;
  RightElement?: React.ReactNode;
  textClassName?: string;
};

export const ExtendedTButton = memo(function ExtendedTButton(
  props: ExtendTButtonProps,
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
