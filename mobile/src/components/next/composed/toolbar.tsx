// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { Portal } from "@rn-primitives/portal";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OnRTL } from "~/lib/react";
import { useTheme } from "~/modules/customization/theme/hooks";
import type { IconButtonProps } from "../base/button-icon";
import { IconButton } from "../base/button-icon";

export function useToolbarOffset(extra = 0) {
  const { bottom } = useSafeAreaInsets();
  // Android Navbar Height + Toolbar Height + 16px Bottom Gap + 16px Top Gap
  return bottom + 48 + 16 + 16 + extra;
}

//#region Toolbar
function Toolbar(props: { children: React.JSX.Element | React.JSX.Element[] }) {
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
    <LinearGradient
      colors={[`${surface}00`, `${surface}FF`]}
      locations={endGradientAt !== 0 ? [0, endGradientAt] : undefined}
      style={{ height }}
      className="absolute inset-x-0 bottom-0"
    />
  );
}
//#endregion

//#region Contents
function Contents(props: { children: React.ReactNode }) {
  return (
    <View className="my-1 h-10 flex-row items-center overflow-hidden rounded-full bg-surfaceContainerLowest">
      {props.children}
    </View>
  );
}
//#endregion

//#region FAB
function FAB(props: Omit<IconButtonProps, "filled" | "size">) {
  return <IconButton {...props} filled size="lg" />;
}
//#endregion

//#region Pre-Build
function Default() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <Toolbar>
      <Contents>
        <IconButton
          icon={OnRTL.decide("east", "west")}
          accessibilityLabel={t("form.back")}
          onPress={() => navigation.goBack()}
        />
      </Contents>
    </Toolbar>
  );
}
//#endregion

//#region Exports
Toolbar.Contents = Contents;
Toolbar.FAB = FAB;

Toolbar.Default = Default;

export { Toolbar };
//#endregion
