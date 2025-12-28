import type { ParseKeys } from "i18next";
import { memo } from "react";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { StyledText, TStyledText } from "../Typography/StyledText";

//#region Container
function Legend(props: { children: React.ReactNode; className?: string }) {
  return <View className={cn("gap-2", props.className)}>{props.children}</View>;
}
//#endregion

//#region Item
function LegendItem(props: {
  labelTextKey: ParseKeys;
  value: string | number;
  color?: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      {props.color ? (
        <View
          style={{ backgroundColor: props.color }}
          className="size-[9px] rounded-full"
        />
      ) : null}
      <TStyledText textKey={props.labelTextKey} className="shrink text-xs" />
      <StyledText dim className="ml-auto">
        {props.value}
      </StyledText>
    </View>
  );
}
//#endregion

//#region Exports
Legend.Item = memo(LegendItem);

export { Legend };
//#endregion
