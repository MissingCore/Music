import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { Search } from "~/resources/icons/Search";
import { Settings } from "~/resources/icons/Settings";
import { useRenderBottomActions } from "../hooks/useBottomActions";
import { useHasNewUpdate } from "../hooks/useHasNewUpdate";

import { OnRTL } from "~/lib/react";
import { createAnimatedMaterialSymbol } from "~/components/Base/AnimatedMaterialSymbol";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Menu } from "~/components/Menu";
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
const AnimatedMenuIcon = createAnimatedMaterialSymbol(
  // "Menu" SVG
  "M176.15-261.08q-11.63 0-19.85-8.22-8.22-8.23-8.22-19.77 0-11.55 8.22-19.76t19.85-8.21h607.89q11.44 0 19.66 8.23 8.22 8.22 8.22 19.77 0 11.54-8.22 19.75t-19.66 8.21H176.15Zm0-191.34q-11.63 0-19.85-8.23-8.22-8.22-8.22-19.77 0-11.54 8.22-19.75t19.85-8.21h607.89q11.44 0 19.66 8.22 8.22 8.23 8.22 19.77t-8.22 19.75q-8.22 8.22-19.66 8.22H176.15Zm0-191.35q-11.63 0-19.85-8.22-8.22-8.23-8.22-19.77 0-11.55 8.22-19.76t19.85-8.21h607.89q11.44 0 19.66 8.22 8.22 8.23 8.22 19.77 0 11.55-8.22 19.76t-19.66 8.21H176.15Z",
  // "Close" SVG
  "M480-440.27 278.38-238.65q-8.3 8.3-19.76 8.25-11.47-.06-19.97-8.56-8.19-8.5-8.03-19.62.15-11.11 8.34-19.3L440.27-480 238.96-682.12q-7.81-7.8-8-19.11-.19-11.31 8-19.81 8.19-8.5 19.46-8.75 11.27-.25 19.96 8.25L480-519.73l201.81-201.81q8.11-8.11 19.57-8.06 11.47.06 20.16 8.56 8 8.5 7.84 19.62-.15 11.11-8.34 19.3L519.73-480l201.31 202.12q7.81 7.8 8 19.11.19 11.31-8 19.81-8.19 8.5-19.46 8.75-11.27.25-19.77-8.44L480-440.27Z",
);

function HomeActions() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const { hasNewUpdate } = useHasNewUpdate();

  return (
    <Menu
      entering={OnRTL.decide(SlideInLeft, SlideInRight)}
      exiting={OnRTL.decide(SlideOutLeft, SlideOutRight)}
      visible={visible}
      anchor={
        <View className="relative">
          <FilledIconButton
            Icon={AnimatedMenuIcon}
            accessibilityLabel={t("term.more")}
            onPress={() => setVisible((prev) => !prev)}
            alternative={visible}
            size="lg"
            className="size-14"
          />
          {!visible && hasNewUpdate && (
            <Animated.View
              entering={FadeIn}
              className="absolute top-3 right-3 size-2 rounded-full bg-primary"
            />
          )}
        </View>
      }
      anchorPosition="top"
      menuClassName="flex-row items-center gap-2"
    >
      <FilledIconButton
        Icon={Search}
        accessibilityLabel={t("feat.search.title")}
        onPress={() => navigation.navigate("Search")}
        size="lg"
        className="size-14"
      />
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
    </Menu>
  );
}
//#endregion
