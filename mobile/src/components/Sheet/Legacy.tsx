import { Toasts } from "@backpackapp-io/react-native-toast";
import type { ParseKeys } from "i18next";
import { cssInterop } from "nativewind";
import { useTranslation } from "react-i18next";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import type { ActionSheetProps } from "react-native-actions-sheet";
import ActionSheet from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "~/lib/style";
import { SheetHeader } from "./SheetHeader";

const WrappedActionSheet = cssInterop(ActionSheet, {
  containerClassName: "containerStyle",
  indicatorClassName: "indicatorStyle",
});

/** Pre-styled sheet. */
export function Sheet({
  titleKey,
  snapTop,
  contentContainerClassName,
  contentContainerStyle,
  children,
  ...props
}: ActionSheetProps & {
  titleKey?: ParseKeys;
  /** If the sheet should open at max screen height. */
  snapTop?: boolean;
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <WrappedActionSheet
      gestureEnabled
      keyboardHandlerEnabled={false}
      CustomHeaderComponent={
        <SheetHeader title={titleKey ? t(titleKey) : undefined} />
      }
      ExtraOverlayComponent={<Toasts />}
      containerClassName={cn("rounded-t-lg bg-canvasAlt", {
        "h-full": snapTop,
      })}
      // Have sheet max height be right before the top app bar.
      //  - Note 1: We've patched the package as it only relies on the top
      //  insets for IOS
      //  - Note 2: The recommended way is to set a `maxHeight`, but that doesn't
      //  work as mentioned:
      //    - https://github.com/ammarahm-ed/react-native-actions-sheet/issues/322#issuecomment-2029560154
      //  - Note 3: With edge-to-edge mode, having the `bottom` was adding
      //  extra bottom padding. This might be related to:
      //    - https://github.com/facebook/react-native/pull/47254
      safeAreaInsets={{ ...insets, top: insets.top + 56, bottom: 0 }}
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
