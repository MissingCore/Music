import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { cn } from "@/lib/style";
import { StyledText } from "../Typography";

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
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="shrink flex-row items-center gap-2">
        {props.color ? (
          <View
            style={{ backgroundColor: props.color }}
            className="size-[9px] rounded-full"
          />
        ) : null}
        <StyledText className="shrink text-xs">{t(props.nameKey)}</StyledText>
      </View>
      <StyledText preset="dimOnSurface">{props.value}</StyledText>
    </View>
  );
}
//#endregion
