import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { ScrollView } from "~/components/Defaults";
import { AccentText } from "~/components/Typography/AccentText";

/** Standard scrollable layout with an option to display a title. */
export function StandardScrollLayout(props: {
  children: React.ReactNode;
  contentContainerClassName?: string;
  /** Key to title in translations. */
  titleKey?: ParseKeys;
  /** Action rendered adjacent to the title. */
  titleAction?: React.ReactNode;
  /** Only takes effect if this is `true` & `titleKey` is provided. */
  showStatusBarShadow?: boolean;
}) {
  const { top } = useSafeAreaInsets();
  const { bottomInset } = useBottomActionsContext();
  const { canvas } = useTheme();

  const [headerHeight, setHeaderHeight] = useState(0);
  const [renderStatusBarShadow, setRenderStatusBarShadow] = useState(false);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!props.titleKey || !props.showStatusBarShadow) return;
      const canShow = headerHeight < e.nativeEvent.contentOffset.y;
      if (canShow && !renderStatusBarShadow) setRenderStatusBarShadow(true);
      if (!canShow && renderStatusBarShadow) setRenderStatusBarShadow(false);
    },
    [
      props.titleKey,
      props.showStatusBarShadow,
      headerHeight,
      renderStatusBarShadow,
    ],
  );

  return (
    <>
      <ScrollView
        onScroll={handleScroll}
        contentContainerStyle={
          props.titleKey
            ? { paddingBottom: bottomInset.withNav + 16 }
            : undefined
        }
        contentContainerClassName={cn(
          "grow gap-6 p-4",
          props.contentContainerClassName,
        )}
      >
        {props.titleKey ? (
          <LayoutHeader
            titleKey={props.titleKey}
            titleAction={props.titleAction}
            getHeaderHeight={(height) => setHeaderHeight(height)}
          />
        ) : undefined}
        {props.children}
      </ScrollView>

      {/* Render shadow under status bar when title is off-screen. */}
      {renderStatusBarShadow ? (
        <LinearGradient
          colors={[`${canvas}FF`, `${canvas}00`]}
          locations={[0.2, 1]}
          style={{ height: top + 56 }}
          pointerEvents="none"
          className="absolute left-0 top-0 w-full"
        />
      ) : null}
    </>
  );
}

function LayoutHeader(props: {
  titleKey: ParseKeys;
  titleAction?: React.ReactNode;
  getHeaderHeight?: (height: number) => void;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  return (
    <View
      onLayout={({ nativeEvent: { layout } }) => {
        if (props.getHeaderHeight) props.getHeaderHeight(layout.height);
      }}
      style={{ paddingTop: top + 16 }}
      className="flex-row items-center justify-between gap-4"
    >
      <AccentText className="text-4xl">{t(props.titleKey)}</AccentText>
      {props.titleAction ? (
        <View className="-mr-2">{props.titleAction}</View>
      ) : undefined}
    </View>
  );
}
