import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";

import { Search } from "~/resources/icons/Search";
import { Settings } from "~/resources/icons/Settings";
import { useRenderBottomActions } from "../hooks/useBottomActions";
import { useHasNewUpdate } from "../hooks/useHasNewUpdate";

import { IconButton } from "~/components/Form/Button/Icon";
import { MiniPlayer } from "./MiniPlayer";

//#region Bottom Actions
/** Actions stickied to the bottom of the screens. */
export function BottomActions() {
  const rendered = useRenderBottomActions();
  //  Extra `View` is to fix positioning when button navigation is selected.
  return (
    <View>
      <Animated.View
        pointerEvents="box-none"
        className="absolute bottom-0 left-0 h-18 w-full flex-row items-center justify-end gap-2 p-4 pt-0"
      >
        {rendered.miniPlayer ? <MiniPlayer /> : null}
        {rendered.navBar ? <HomeActions /> : null}
      </Animated.View>
    </View>
  );
}
//#endregion

//#region Home Actions
function HomeActions() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();

  return (
    <Animated.View
      entering={SlideInRight}
      exiting={SlideOutRight}
      className="flex-row items-center rounded-full bg-surfaceContainerLowest"
    >
      <IconButton
        Icon={Search}
        accessibilityLabel={t("feat.search.title")}
        onPress={() => navigation.navigate("Search")}
        size="lg"
        className="size-14"
      />
      <View className="relative">
        <IconButton
          Icon={Settings}
          accessibilityLabel={t("term.settings")}
          onPress={() => navigation.navigate("Settings")}
          size="lg"
          className="size-14"
        />
        {hasNewUpdate && (
          <View className="absolute top-3 right-3 size-2 rounded-full bg-primary" />
        )}
      </View>
    </Animated.View>
  );
}
//#endregion
