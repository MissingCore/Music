import type { TrueSheetProps } from "@lodev09/react-native-true-sheet";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { ParseKeys } from "i18next";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import type { StyleProp, ViewStyle } from "react-native";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "~/hooks/useTheme";

import { BorderRadius } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { Marquee } from "./Containment/Marquee";
import { StyledText } from "./Typography/StyledText";

interface SheetProps extends TrueSheetProps {
  titleKey?: ParseKeys;
  /** Makes sheet accessible globally using this key. */
  globalKey?: string;
  /** If the sheet should open at max screen height. */
  snapTop?: boolean;
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const Sheet = forwardRef<TrueSheet, SheetProps>(function Sheet(
  {
    titleKey,
    globalKey,
    snapTop,
    contentContainerClassName,
    contentContainerStyle,
    children,
    ...props
  },
  ref,
) {
  const { t } = useTranslation();
  const { canvasAlt } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  return (
    <TrueSheet
      ref={ref}
      name={globalKey}
      sizes={[snapTop ? "large" : "auto"]}
      backgroundColor={canvasAlt}
      cornerRadius={BorderRadius.lg}
      // Sheet max height will be just before the `<TopAppBar />`.
      maxHeight={screenHeight - insets.top - 56}
      grabber={false}
      {...props}
    >
      <SheetHeader title={titleKey ? t(titleKey) : undefined} />
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
    </TrueSheet>
  );
});

/** Header component to be used in `<Sheet />`. */
function SheetHeader({ title }: { title?: string }) {
  return (
    <View className={cn("gap-2 px-4 pb-2", { "pb-6": !!title })}>
      <View className="mx-auto my-[10px] h-1 w-8 rounded-full bg-onSurface" />
      {title ? (
        <Marquee center>
          <StyledText className="text-lg">{title}</StyledText>
        </Marquee>
      ) : null}
    </View>
  );
}
