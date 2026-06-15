import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { usePreferenceStore } from "~/stores/Preference/store";
import { useRenderBottomActions } from "../../hooks/useBottomActions";

import { MiniPlayer } from "./MiniPlayer";
import { Navbar, SearchButton, SettingsButton } from "./NavActions";

//#region Bottom Actions
/** Actions stickied to the bottom of the screens. */
export function BottomActions() {
  const showNavbar = usePreferenceStore((s) => s.showNavbar);
  //  Extra `View` is to fix positioning when button navigation is selected.
  return (
    <View>
      <Animated.View
        layout={LinearTransition}
        pointerEvents="box-none"
        className="absolute bottom-0 left-0 w-full items-end gap-2 p-4 pt-0"
      >
        {showNavbar ? <WithNavBar /> : <WithOutNavBar />}
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
          className="w-full flex-row gap-2"
        >
          <SearchButton />
          <Navbar />
          <SettingsButton />
        </Animated.View>
      ) : null}
    </>
  );
}

/** Bottom action layout when the user doesn't want to show the navbar. */
function WithOutNavBar() {
  const rendered = useRenderBottomActions();
  return (
    <Animated.View
      layout={LinearTransition}
      className="w-full flex-row justify-between gap-2"
    >
      {rendered.navBar ? <SearchButton /> : null}
      {rendered.miniPlayer ? (
        <Animated.View layout={LinearTransition} className="w-full shrink grow">
          <MiniPlayer />
        </Animated.View>
      ) : null}
      {rendered.navBar ? <SettingsButton /> : null}
    </Animated.View>
  );
}
