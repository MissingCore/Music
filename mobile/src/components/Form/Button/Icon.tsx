import { memo } from "react";
import { Pressable, View } from "react-native";

import type { Icon } from "~/resources/icons/type";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import type { PressProps } from "./types";

type ButtonSize = "sm" | "md" | "lg";

const ButtonConfig = {
  sm: { buttonSize: "size-8", iconSize: 20 },
  md: { buttonSize: "size-11", iconSize: 24 },
  lg: { buttonSize: "size-11", iconSize: 32 },
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
  _iconColor?: string;
};

//#region Default
export const IconButton = memo(function IconButton({
  Icon,
  size = "md",
  filled,
  _iconColor,
  ...props
}: IconButtonProps) {
  const { onSurface } = useTheme();
  const { buttonSize, iconSize } = ButtonConfig[size];

  return (
    <Pressable
      {...props}
      className={cn(
        "items-center justify-center rounded-full disabled:opacity-25",
        buttonSize,
        props.className,
      )}
    >
      {({ pressed }) => (
        <View
          collapsable={false} // Prevents view flattening.
          style={[pressed && { backgroundColor: `${onSurface}80` }]}
          className="rounded-full p-1.5"
        >
          <Icon size={iconSize} color={_iconColor} filled={filled} />
        </View>
      )}
    </Pressable>
  );
});
//#endregion

//#region Filled
export const FilledIconButton = memo(function FilledIconButton({
  Icon,
  size = "md",
  filled,
  _iconColor,
  ...props
}: IconButtonProps) {
  const { buttonSize, iconSize } = ButtonConfig[size];
  return (
    <Pressable
      {...props}
      className={cn(
        "items-center justify-center rounded-full bg-surface active:opacity-75 disabled:opacity-25",
        buttonSize,
        props.className,
      )}
    >
      <Icon size={iconSize} color={_iconColor} filled={filled} />
    </Pressable>
  );
});
//#endregion
