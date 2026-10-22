// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { useRenderBottomActions } from "./useBottomActions";

import { MiniPlayer } from "./MiniPlayer";
import { Navbar, SearchButton, SettingsButton } from "./NavActions";

//#region Bottom Actions
/** Actions stickied to the bottom of the screens. */
export function BottomActions() {
  //  Extra `View` is to fix positioning when button navigation is selected.
  return (
    <View>
      <Animated.View
        layout={LinearTransition}
        pointerEvents="box-none"
        className="absolute bottom-safe left-0 w-full items-end gap-2 p-4 pt-0"
      >
        <WithNavBar />
      </Animated.View>
    </View>
  );
}
//#endregion

/** Bottom action layout when the user wants to show the navbar. */
function WithNavBar() {
  const rendered = useRenderBottomActions();
  return (
    <>
      {rendered.miniPlayer ? <MiniPlayer /> : null}
      {rendered.navBar ? (
        <Animated.View
          layout={LinearTransition}
          className="-z-1 w-full flex-row gap-2"
        >
          <SearchButton />
          <Navbar />
          <SettingsButton />
        </Animated.View>
      ) : null}
    </>
  );
}
