import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { Search } from "~/resources/icons/Search";
import { Settings } from "~/resources/icons/Settings";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useRenderBottomActions } from "../../hooks/useBottomActions";
import { useHasNewUpdate } from "../../hooks/useHasNewUpdate";

import { FilledIconButton } from "~/components/Form/Button/Icon";
import { MiniPlayer } from "./MiniPlayer";
import { Navbar } from "./Navbar";

//#region Bottom Actions
/** Actions stickied to the bottom of the screens. */
export function BottomActions() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  const rendered = useRenderBottomActions();
  const showNavbar = usePreferenceStore((s) => s.showNavbar);

  //  Extra `View` is to fix positioning when button navigation is selected.
  return (
    <View>
      <Animated.View
        pointerEvents="box-none"
        className="absolute bottom-0 left-0 w-full flex-row items-end gap-2 p-4 pt-0"
      >
        {rendered.navBar ? (
          <FilledIconButton
            Icon={Search}
            accessibilityLabel={t("feat.search.title")}
            onPress={() => navigation.navigate("Search")}
            size="lg"
            className="size-14"
          />
        ) : null}
        <View className="shrink grow gap-2">
          {rendered.miniPlayer ? <MiniPlayer /> : null}
          {rendered.navBar && showNavbar ? <Navbar /> : null}
        </View>
        {rendered.navBar ? (
          <View className="relative">
            <FilledIconButton
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
        ) : null}
      </Animated.View>
    </View>
  );
}
//#endregion
