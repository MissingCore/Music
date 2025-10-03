import type {
  ClickActionProps,
  FlexWidgetStyle,
} from "react-native-android-widget";
import { FlexWidget } from "react-native-android-widget";

import type { WithDimensions } from "../types";

/**
 * General layout for widget while also center-aligning it on devices where
 * a `1x1` area isn't necessarily square.
 */
export function WidgetBaseLayout({
  height,
  width,
  transparent,
  style,
  ...props
}: WithDimensions<
  ClickActionProps & {
    children: React.ReactNode;
    transparent?: boolean;
    style?: FlexWidgetStyle;
  }
>) {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FlexWidget
        style={{
          overflow: "hidden",
          height,
          width,
          // Nothing widget color from color picker.
          backgroundColor: transparent ? "#00000000" : "#1A1B21",
          // Estimated radius used by Nothing widgets from experimentation.
          borderRadius: 20,
          ...style,
        }}
        {...props}
      />
    </FlexWidget>
  );
}
