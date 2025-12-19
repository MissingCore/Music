import type { ParseKeys } from "i18next";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { StyledText, TStyledText } from "../Typography/StyledText";

//#region Legend
/** Wrapper for list of `<LegendItem />` for consistent gaps. */
export function Legend(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("gap-2", props.className)}>{props.children}</View>;
}
//#endregion

//#region Legend Item
/** Help describe items represented in for example a `<ProgressBar />`. */
export function LegendItem(props: {
  nameKey: ParseKeys;
  value: string | number;
  color?: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="shrink flex-row items-center gap-2">
        {props.color ? (
          <View
            style={{ backgroundColor: props.color }}
            className="size-2.25 rounded-full"
          />
        ) : null}
        <TStyledText textKey={props.nameKey} className="shrink text-xs" />
      </View>
      <StyledText dim>{props.value}</StyledText>
    </View>
  );
}
//#endregion
