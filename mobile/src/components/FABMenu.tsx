import type { ViewStyle } from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { cn } from "~/lib/style";

type FABMenuProps = AnimatedProps<typeof Animated.View> & {
  visible: boolean;
  anchor: React.ReactNode;
  /** Styles container wrapping menu items. */
  menuStyle?: ViewStyle;
  /** Styles container wrapping menu items. */
  menuClassName?: string;
  /** Items rendered inside the menu. */
  children: React.ReactNode;
};

export function FABMenu({
  anchor,
  visible,
  menuStyle,
  menuClassName,
  children,
  ...props
}: FABMenuProps) {
  return (
    <Animated.View {...props} className="relative">
      {visible ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          style={menuStyle}
          className={cn(menuClassName, "absolute right-0 bottom-full")}
        >
          {children}
        </Animated.View>
      ) : null}
      {anchor}
    </Animated.View>
  );
}
