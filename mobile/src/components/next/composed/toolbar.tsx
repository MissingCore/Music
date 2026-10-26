// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import {
  useFocusEffect,
  useNavigation,
  useNavigationState,
} from "@react-navigation/native";
import { Portal, PortalHost } from "@rn-primitives/portal";
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
  // Android Navbar Height + Toolbar Height + 16px Bottom Offset
  return bottom + 48 + 16 + extra;
}

//# Configuration
const hiddenRoutes = ["NowPlaying-", "Upcoming-"] as const;

/** Returns a boolean indicating that the toolbar should be fully hidden. */
function useIsToolbarHidden() {
  return useNavigationState((s) =>
    hiddenRoutes.some((key) => s.routes[s.index]?.key?.startsWith(key)),
  );
}
//#endregion

//#region Provider
/**
 * Render once at the root to provide a smoother animation for the "actions"
 * portion of the toolbar.
 */
function Provider() {
  const isHidden = useIsToolbarHidden();
  if (isHidden) return null;
  return (
    <View className="absolute inset-x-0 bottom-0 flex-row items-center justify-between gap-2 px-4 pb-safe-offset-4">
      <Backdrop />
      <Animated.View
        layout={LinearTransition}
        className="my-1 h-10 shrink flex-row items-center overflow-hidden rounded-full bg-surfaceContainerLowest"
      >
        <PortalHost name="toolbar-actions-host" />
      </Animated.View>
      <PortalHost name="toolbar-FAB-host" />
    </View>
  );
}

function Backdrop() {
  const { surface } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const height = useToolbarOffset();
  return (
    <View className="absolute inset-x-0 bottom-0">
      <LinearGradient
        colors={[`${surface}00`, `${surface}FF`]}
        locations={[0, 1 - bottom / height]}
        style={{ height }}
        className="absolute inset-x-0 bottom-0"
      />
    </View>
  );
}
//#endregion

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
  return props.children;
}
//#endregion

//#region Actions
function Actions(props: { children: React.ReactNode }) {
  return (
    <Portal name="toolbar-actions" hostName="toolbar-actions-host">
      {props.children}
    </Portal>
  );
}
//#endregion

//#region FAB
function FABContainer(props: { children: React.ReactNode }) {
  return (
    <Portal name="toolbar-FAB" hostName="toolbar-FAB-host">
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        className="rounded-full bg-surfaceContainerLowest"
      >
        {props.children}
      </Animated.View>
    </Portal>
  );
}

function FAB(props: Omit<IconButtonProps, "filled" | "size">) {
  return (
    <FABContainer>
      <IconButton {...props} filled size="lg" />
    </FABContainer>
  );
}
//#endregion

//#region Pre-Build
function Default() {
  return (
    <Toolbar>
      <Actions>
        <Back />
      </Actions>
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
Toolbar.Provider = Provider;

Toolbar.Actions = Actions;
Toolbar.FABContainer = FABContainer;
Toolbar.FAB = FAB;

Toolbar.Default = Default;
Toolbar.Back = Back;

export { Toolbar };
//#endregion
