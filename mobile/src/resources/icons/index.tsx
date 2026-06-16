import { createNanoIconSet } from "react-native-nano-icons";

import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";
import glyphMap from "./app-icons.glyphmap.json";

const AppIcons = createNanoIconSet(glyphMap);

export type SupportedIcoName = React.ComponentProps<typeof AppIcons>["name"];

type Props = {
  name: SupportedIcoName;
  /** Defaults to `24px`. */
  size?: number;
  /** Defaults to theme's `onSurface` color. */
  color?: AppColor;
};

export function Icon({ name, size = 24, color }: Props) {
  const usedColor = useColor(color, "onSurface");
  return (
    <AppIcons
      name={name}
      size={size}
      color={usedColor}
      allowFontScaling={false}
    />
  );
}
