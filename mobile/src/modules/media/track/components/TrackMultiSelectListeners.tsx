import { useNavigation } from "@react-navigation/native";
import { Portal } from "@rn-primitives/portal";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrackMultiSelectStore } from "../core/store";
import { resetTrackMultiSelect } from "../core/actions";

import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TopDownGradient } from "~/components/Gradient";
import { StyledText } from "~/components/Typography/StyledText";

export function TrackMultiSelectListeners() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", resetTrackMultiSelect);
    return () => unsubscribe();
  }, [navigation]);

  return <TrackMultiSelectMenu />;
}

//#region Selection Menu
const ESTIMATED_MENU_HEIGHT = 100;

export function TrackMultiSelectMenu() {
  const insets = useSafeAreaInsets();
  const isMultiSelectEnabled = useTrackMultiSelectStore((s) => s.enabled);

  return isMultiSelectEnabled ? (
    <Portal name="track-multi-select-menu-portal">
      <Animated.View
        entering={SlideInUp}
        exiting={SlideOutUp}
        style={{ paddingTop: insets.top }}
        className="absolute top-0 right-0 left-0"
      >
        <TopDownGradient
          height={ESTIMATED_MENU_HEIGHT + insets.top}
          startFrom={insets.top}
          color="primary"
          className="absolute inset-0"
        />
        <View className="flex-row items-center justify-between gap-4 p-4">
          <SelectionCount />
          <MutliSelectActions />
        </View>
      </Animated.View>
    </Portal>
  ) : null;
}

function SelectionCount() {
  const { t } = useTranslation();
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
      <FilledIconButton
        icon="close"
        accessibilityLabel={t("form.close")}
        onPress={resetTrackMultiSelect}
        size="xs"
        _iconColor="error"
      />
      <StyledText className="mr-4 text-xs">
        {t("template.countSelected", { count: amountSelected })}
      </StyledText>
    </View>
  );
}

function MutliSelectActions() {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
      <FilledIconButton
        icon="favorite"
        accessibilityLabel={t("term.favorite")}
        onPress={() => console.log("Favorite selected tracks...")}
      />
      <FilledIconButton
        icon="playlist-add"
        accessibilityLabel={t("feat.modalTrack.extra.addToPlaylist")}
        onPress={() => console.log("Opening `Add to Playlist` sheet...")}
      />
      <FilledIconButton
        icon="visibility-off-filled"
        accessibilityLabel={t("template.entryHide", { name: t("term.tracks") })}
        onPress={() => console.log("Opening confirmation modal...")}
      />
    </View>
  );
}
//#endregion
