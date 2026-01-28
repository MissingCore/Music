import type { LegendListProps } from "@legendapp/list";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";

import { MoreHoriz } from "~/resources/icons/MoreHoriz";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";

import { useBottomActionsInset } from "~/navigation/hooks/useBottomActions";

import {
  AnimatedLegendList,
  useAnimatedLegendListRef,
} from "~/components/Defaults";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { Scrollbar, useScrollbarContext } from "~/components/NScrollbar";
import { SafeContainer } from "~/components/SafeContainer";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { AccentText } from "~/components/Typography/AccentText";

export function NScrollListLayout<TData>({
  topShadow = 24,
  ...props
}: Omit<LegendListProps<TData>, "onContentSizeChange" | "onLayout"> & {
  /** How tall of a transition we want when scrolling up. This will become `paddingTop`. */
  topShadow?: number;
}) {
  const { surface } = useTheme();
  const bottomInset = useBottomActionsInset();
  const quickScroll = usePreferenceStore((s) => s.quickScroll);
  const internalListRef = useAnimatedLegendListRef();

  const { layoutHandlers, layoutInfo, onScroll } = useScrollbarContext();
  const scrollHandler = useAnimatedScrollHandler({ onScroll });

  return (
    <View className="relative flex-1">
      <AnimatedLegendList
        ref={internalListRef}
        {...layoutHandlers}
        onScroll={scrollHandler}
        maintainVisibleContentPosition={false}
        {...props}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: topShadow,
          paddingBottom: bottomInset.withNav + 16,
        }}
      />
      <LinearGradient
        colors={[`${surface}E6`, `${surface}00`]}
        pointerEvents="none"
        style={{ height: topShadow }}
        className="absolute top-0 left-0 w-full"
      />
      <Scrollbar
        listRef={internalListRef}
        scrollbarOffset={{ top: topShadow, bottom: bottomInset.withNav + 16 }}
        isVisible={quickScroll}
        {...layoutInfo}
      />
    </View>
  );
}

/** Accompanying header for `NScrollListLayout`. */
export function NScrollListHeader(props: {
  titleKey: ParseKeys;
  OptionsSheet: (props: { ref: TrueSheetRef }) => React.JSX.Element;
  /** Wrap additional "actions" which will appear before the "Screen Options" button. */
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const sheetRef = useSheetRef();

  const IconButtonComponent = useMemo(
    () => (props.children ? IconButton : FilledIconButton),
    [props.children],
  );

  return (
    <>
      <props.OptionsSheet ref={sheetRef} />
      <SafeContainer
        additionalTopOffset={24}
        className="flex-row items-center justify-between gap-4 px-4"
      >
        <Marquee>
          <AccentText className="text-4xl">{t(props.titleKey)}</AccentText>
        </Marquee>
        <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
          {props.children}
          <IconButtonComponent
            Icon={MoreHoriz}
            accessibilityLabel={t("feat.modalViewPreference.title")}
            onPress={() => sheetRef.current?.present()}
            size="sm"
          />
        </View>
      </SafeContainer>
    </>
  );
}
