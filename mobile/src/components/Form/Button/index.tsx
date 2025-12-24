import type { ParseKeys } from "i18next";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { cn } from "~/lib/style";
import { TStyledText } from "../../Typography/StyledText";

export function Button({ className, ...props }: PressableProps) {
  return (
    <Pressable
      className={cn(
        "min-h-12 min-w-12 items-center justify-center gap-2 rounded-md bg-surface p-4",
        "active:opacity-75 disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
}

export function ExtendedTButton(
  props: PressableProps & {
    textKey: ParseKeys;
    /** **Note:** Text will be left-aligned if provided. */
    LeftElement?: React.ReactNode;
    RightElement?: React.ReactNode;
    textClassName?: string;
  },
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
      <TStyledText
        textKey={props.textKey}
        bold
        className={cn(
          "shrink text-sm",
          { "text-center": !props.LeftElement },
          props.textClassName,
        )}
      />
      {props.RightElement}
    </Button>
  );
}
