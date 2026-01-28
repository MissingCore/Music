import type { LegendListProps } from "@legendapp/list";
import type { ParseKeys } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";

import { MoreHoriz } from "~/resources/icons/MoreHoriz";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useBottomActionsInset } from "../hooks/useBottomActions";

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

export function NScrollListLayout<TData>(
  props: Omit<LegendListProps<TData>, "onContentSizeChange" | "onLayout">,
) {
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
          padding: 16,
          paddingBottom: bottomInset.withNav + 16,
        }}
      />
      <Scrollbar
        listRef={internalListRef}
        scrollbarOffset={{ top: 0, bottom: bottomInset.withNav + 16 }}
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
        additionalTopOffset={16}
        className="flex-row items-center justify-between gap-4 p-4"
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
