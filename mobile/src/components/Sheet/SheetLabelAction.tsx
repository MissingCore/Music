import type { ParseKeys } from "i18next";
import { View } from "react-native";

import { Marquee } from "../Marquee";
import { TStyledText } from "../Typography/StyledText";

export function SheetLabelAction(props: {
  labelKey: ParseKeys;
  RightElement: React.ReactNode;
}) {
  return (
    <View className="min-h-8 flex-row items-center justify-between gap-2">
      <Marquee color="surfaceBright">
        <TStyledText textKey={props.labelKey} bold className="text-sm" />
      </Marquee>
      {props.RightElement}
    </View>
  );
}
