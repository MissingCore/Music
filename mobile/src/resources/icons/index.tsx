import { createNanoIconSet } from "react-native-nano-icons";

import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";
import glyphMap from "./material-symbols.glyphmap.json";

const MaterialIcon = createNanoIconSet(glyphMap);

type SupportedIcoName = React.ComponentProps<typeof MaterialIcon>["name"];

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
    <MaterialIcon
      name={name}
      size={size}
      color={usedColor}
      allowFontScaling={false}
    />
  );
}
