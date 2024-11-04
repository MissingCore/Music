import { cssInterop } from "nativewind";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import type { ActionSheetProps } from "react-native-actions-sheet";
import ActionSheet from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/style";
import { SheetHeader } from "./SheetHeader";

const WrappedActionSheet = cssInterop(ActionSheet, {
  containerClassName: "containerStyle",
  indicatorClassName: "indicatorStyle",
});

/** Pre-styled sheet. */
export function Sheet({
  title,
  snapTop,
  contentContainerClassName,
  contentContainerStyle,
  children,
  ...props
}: ActionSheetProps & {
  title?: string;
  /** If the sheet should open at max screen height. */
  snapTop?: boolean;
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <WrappedActionSheet
      gestureEnabled
      CustomHeaderComponent={<SheetHeader title={title} />}
      containerClassName={cn("rounded-t-lg bg-canvas dark:bg-neutral5", {
        "h-full": snapTop,
      })}
      // Have sheet max height be right before the top app bar.
      //  - Note 1: We've patched the package as it only relies on the top
      //  insets for IOS
      //  - Note 2: The recommended way is to set a `maxHeight`, but that doesn't
      //  work as mentioned: https://github.com/ammarahm-ed/react-native-actions-sheet/issues/322#issuecomment-2029560154
      safeAreaInsets={{ ...insets, top: insets.top + 56 }}
      {...props}
    >
      <View
        style={contentContainerStyle}
        className={cn(
          "p-4 pt-0",
          { "h-full pb-0": snapTop },
          contentContainerClassName,
        )}
      >
        {children}
      </View>
    </WrappedActionSheet>
  );
}
