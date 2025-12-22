import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import type { Icon } from "~/resources/icons/type";
import { useTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";

export function IconButton({
  Icon,
  large = false,
  active,
  filled,
  className,
  ...pressableProps
}: {
  Icon: (props: Icon) => React.JSX.Element;
  accessibilityLabel: string;
  onPress: PressableProps["onPress"];
  /** Scale the icon up to `32px`. */
  large?: boolean;
  /** Switches the icon color to red. */
  active?: boolean;
  /** Use the `filled` variant on the icon if available. */
  filled?: boolean;
  disabled?: PressableProps["disabled"];
  className?: string;
}) {
  const { onSurface } = useTheme();
  const iconColor = active ? Colors.red : undefined;
  return (
    <Pressable
      android_ripple={{
        color: onSurface,
        radius: large ? 24 : 18,
        foreground: true,
      }}
      className={cn(
        "items-center justify-center p-3 disabled:opacity-25",
        { "p-2": large },
        className,
      )}
      {...pressableProps}
    >
      <Icon size={large ? 32 : 24} color={iconColor} filled={filled} />
    </Pressable>
  );
}
