import { View } from "react-native";

import { cn } from "@/lib/style";
import { StyledText } from "../Typography";

//#region Legend
/** Wrapper for list of `<LegendItem />` for consistent gaps. */
export function Legend({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("gap-2", className)}>{children}</View>;
}
//#endregion

//#region Legend Item
/** Help describe items represented in for example a `<ProgressBar />`. */
export function LegendItem({
  name,
  value,
  color,
}: {
  name: string;
  value: string | number;
  color?: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="shrink flex-row items-center gap-2">
        {color ? (
          <View
            style={{ backgroundColor: color }}
            className="size-[9px] rounded-full"
          />
        ) : null}
        <StyledText className="shrink text-xs">{name}</StyledText>
      </View>
      <StyledText preset="dimOnSurface">{value}</StyledText>
    </View>
  );
}
//#endregion
