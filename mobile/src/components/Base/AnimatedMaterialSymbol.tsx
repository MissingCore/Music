import Animated from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";

import type { Icon } from "~/resources/icons/type";
import { useColor } from "~/hooks/useTheme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Create an Icon where setting the `alternative` prop will animate the
 * SVG via Reanimated's CSS SVG Animations.
 * - **Only support a single `d` path.**
 */
export function createAnimatedMaterialSymbol(
  initDPath: string,
  toDPath: string,
) {
  return function AnimatedMaterialSymbol({
    size = 24,
    color,
    alternative = false,
  }: Icon) {
    const usedColor = useColor(color, "onSurface");
    return (
      <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
        <AnimatedPath
          animatedProps={{
            animationDuration: "150ms",
            animationFillMode: "forwards",
            animationName: {
              from: { d: alternative ? initDPath : toDPath },
              to: { d: alternative ? toDPath : initDPath },
            },
            animationTimingFunction: "linear",
          }}
        />
      </Svg>
    );
  };
}
