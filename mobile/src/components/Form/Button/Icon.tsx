import { memo } from "react";
import { Pressable } from "react-native";

import type { Icon } from "~/resources/icons/type";

import { cn } from "~/lib/style";
import type { PressProps } from "./types";

type ButtonSize = "sm" | "md" | "lg";

const ButtonConfig = {
  sm: { button: "size-8", icon: 20 },
  md: { button: "size-11", icon: 24 },
  lg: { button: "size-11", icon: 32 },
} as const;

type IconButtonProps = {
  Icon: (props: Icon) => React.JSX.Element;
  accessibilityLabel: string;
  onPress: PressProps["onPress"];
  disabled?: boolean;
  /** Defaults to `md`. */
  size?: ButtonSize;
  /** Use the `filled` variant on the icon if available. */
  filled?: boolean;
  className?: string;
  /** Used internally to set the default pressed & disabled styles. */
  _psuedoClassName?: string;
  _iconColor?: string;
};

//#region Default
export const IconButton = memo(function IconButton({
  Icon,
  size = "md",
  _psuedoClassName = "active:bg-onSurface/25 disabled:opacity-25",
  filled,
  _iconColor,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      {...props}
      className={cn(
        "items-center justify-center rounded-full",
        ButtonConfig[size].button,
        _psuedoClassName,
        props.className,
      )}
    >
      <Icon size={ButtonConfig[size].icon} color={_iconColor} filled={filled} />
    </Pressable>
  );
});
//#endregion

//#region Filled
export const FilledIconButton = memo(function FilledIconButton(
  props: IconButtonProps,
) {
  return (
    <IconButton
      {...props}
      className={cn("bg-surface", props.className)}
      _psuedoClassName={cn(
        "active:opacity-75 disabled:opacity-25",
        props._psuedoClassName,
      )}
    />
  );
});
//#endregion
