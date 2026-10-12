// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Portal } from "@rn-primitives/portal";
import { useCallback, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OnRTL } from "~/lib/react";
import { useTheme } from "~/modules/customization/theme/hooks";
import type { IconButtonProps } from "../base/button-icon";
import { IconButton } from "../base/button-icon";

export const ToolbarScreenOffset = "py-safe-offset-20" as const;

export function useToolbarOffset(extra = 0) {
  const { bottom } = useSafeAreaInsets();
  // Android Navbar Height + Toolbar Height + 16px Bottom Offset + 16px Top Offset
  return bottom + 48 + 16 + 16 + extra;
}

//#region Toolbar
function Toolbar(props: { children: React.JSX.Element | React.JSX.Element[] }) {
  const [visible, setVisible] = useState(false);

  // Used to re-create the portal after navigating back (since on screen
  // unmount, the portal is destroyed).
  useFocusEffect(
    useCallback(() => {
      setVisible(true);
      return () => setVisible(false);
    }, []),
  );

  // Hide the toolbar on screens that don't support it.
  if (!visible) return null;
  return (
    <Portal name="toolbar">
      <Backdrop />
      <View className="absolute inset-x-0 bottom-0 flex-row items-center justify-between px-4 pb-safe-offset-4">
        {props.children}
      </View>
    </Portal>
  );
}

function Backdrop() {
  const { surface } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const height = useToolbarOffset();

  const endGradientAt = bottom / height;

  return (
    <Animated.View exiting={FadeOut}>
      <LinearGradient
        colors={[`${surface}00`, `${surface}FF`]}
        locations={endGradientAt !== 0 ? [0, endGradientAt] : undefined}
        style={{ height }}
        className="absolute inset-x-0 bottom-0"
      />
    </Animated.View>
  );
}
//#endregion

//#region Contents
function Contents(props: { children: React.ReactNode }) {
  return (
    <Animated.View
      // Layout animation does not work when navigating back (when navigation
      // forwards, we update the existing portal).
      layout={LinearTransition}
      entering={FadeIn}
      exiting={FadeOut}
      className="my-1 h-10 flex-row items-center overflow-hidden rounded-full bg-surfaceContainerLowest"
    >
      {props.children}
    </Animated.View>
  );
}
//#endregion

//#region FAB
function FAB(props: Omit<IconButtonProps, "filled" | "size">) {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <IconButton {...props} filled size="lg" />
    </Animated.View>
  );
}
//#endregion

//#region Pre-Build
function Default() {
  return (
    <Toolbar>
      <Contents>
        <Back />
      </Contents>
    </Toolbar>
  );
}

function Back() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <IconButton
      icon={OnRTL.decide("east", "west")}
      accessibilityLabel={t("form.back")}
      onPress={() => navigation.goBack()}
    />
  );
}
//#endregion

//#region Exports
Toolbar.Contents = Contents;
Toolbar.FAB = FAB;

Toolbar.Default = Default;
Toolbar.Back = Back;

export { Toolbar };
//#endregion
