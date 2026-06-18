import { useNavigation } from "@react-navigation/native";
import { Portal } from "@rn-primitives/portal";
import { useEffect } from "react";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrackMultiSelectStore } from "../core/store";
import { resetTrackMultiSelect } from "../core/actions";

import { TopDownGradient } from "~/components/Gradient";

export function TrackMultiSelectListeners() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", resetTrackMultiSelect);
    return () => unsubscribe();
  }, [navigation]);

  return <TrackMultiSelectMenu />;
}

const ESTIMATED_MENU_HEIGHT = 100;

export function TrackMultiSelectMenu() {
  const insets = useSafeAreaInsets();
  const isMultiSelectEnabled = useTrackMultiSelectStore((s) => s.enabled);

  return isMultiSelectEnabled ? (
    <Portal name="track-multi-select-menu-portal">
      <Animated.View
        entering={SlideInUp}
        exiting={SlideOutUp}
        className="absolute top-0 right-0 left-0"
      >
        <TopDownGradient
          height={ESTIMATED_MENU_HEIGHT + insets.top}
          startFrom={insets.top}
          color="primary"
        />
      </Animated.View>
    </Portal>
  ) : null;
}
