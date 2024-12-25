import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function CreateNewFolder({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M108.08-188.08v-583.84h287.88l75.96 75.96h380v507.88H108.08Zm55.96-55.96h631.92V-640H448.93l-75.89-75.96h-209v471.92Zm0 0v-471.92V-244.04ZM570-334.85h55.96v-79.19h79.19V-470h-79.19v-79.19H570V-470h-79.19v55.96H570v79.19Z" />
    </Svg>
  );
}
