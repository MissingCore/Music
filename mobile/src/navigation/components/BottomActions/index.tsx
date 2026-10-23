// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { useRenderBottomActions } from "./useBottomActions";

import { MiniPlayer } from "./MiniPlayer";

//#region Bottom Actions
/** Actions stickied to the bottom of the screens. */
export function BottomActions() {
  const rendered = useRenderBottomActions();
  //  Extra `View` is to fix positioning when button navigation is selected.
  return (
    <View>
      <Animated.View
        layout={LinearTransition}
        pointerEvents="box-none"
        className="absolute bottom-safe-offset-14 left-0 w-full items-end p-4 pt-0"
      >
        {rendered.miniPlayer ? <MiniPlayer /> : null}
      </Animated.View>
    </View>
  );
}
//#endregion
