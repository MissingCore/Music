import type { ParseKeys } from "i18next";
import { useEffect } from "react";
import { Dimensions, View } from "react-native";
import BootSplash from "react-native-bootsplash";
import Animated, {
  LinearTransition,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Save } from "~/resources/icons/Save";
import { Warning } from "~/resources/icons/Warning";
import { useScanningProgressStore } from "../ScanningProgress";

import { CachedSlider } from "~/components/Form/Slider";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

export function ScanningProgress() {
  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require("../../../../assets/bootsplash/manifest.json"),
    logo: require("../../../../assets/bootsplash/light-logo.png"),
    darkLogo: require("../../../../assets/bootsplash/logo.png"),

    animate: () => {},
  });
  const { bottom } = useSafeAreaInsets();

  return (
    <Animated.View {...container}>
      <Animated.Image {...logo} />
      <Animated.View
        layout={LinearTransition}
        style={{
          width: Dimensions.get("window").width - 32,
          bottom: bottom + 32,
        }}
        className="absolute left-4 gap-4"
      >
        <TracksSavingProgress />
        <ArtworkSavingProgress />
      </Animated.View>
    </Animated.View>
  );
}

function TracksSavingProgress() {
  const currProgress = useSharedValue(0);
  const scannedTracks = useScanningProgressStore((s) => s.scannedTracks);
  const modifiedTracks = useScanningProgressStore((s) => s.modifiedTracks);
  const failedTrackScans = useScanningProgressStore((s) => s.failedTrackScans);

  useEffect(() => {
    currProgress.value = withSpring(
      scannedTracks + failedTrackScans,
      SpringConfig,
    );
  }, [currProgress, scannedTracks, failedTrackScans]);

  if (modifiedTracks === 0) return null;
  return (
    <View className="gap-2">
      <CachedSlider
        {...SliderConfig}
        liveValue={currProgress}
        max={modifiedTracks}
      />
      <View className="flex-row items-center justify-between">
        <ProgressLabel textKey="feat.onboarding.extra.saveTracks" />
        <View className="flex-row items-center gap-2">
          <IconStatus
            Icon={Save}
            value={
              scannedTracks + failedTrackScans === modifiedTracks
                ? scannedTracks
                : `${scannedTracks}/${modifiedTracks}`
            }
          />
          <IconStatus Icon={Warning} value={failedTrackScans} />
        </View>
      </View>
    </View>
  );
}

function ArtworkSavingProgress() {
  const currProgress = useSharedValue(0);
  const checkedArtwork = useScanningProgressStore((s) => s.checkedArtwork);
  const uncheckedArtwork = useScanningProgressStore((s) => s.uncheckedArtwork);

  useEffect(() => {
    currProgress.value = withSpring(checkedArtwork, SpringConfig);
  }, [currProgress, checkedArtwork]);

  if (uncheckedArtwork === 0) return null;
  return (
    <View className="gap-2">
      <CachedSlider
        {...SliderConfig}
        liveValue={currProgress}
        max={uncheckedArtwork}
      />
      <View className="grow flex-row items-center justify-between">
        <ProgressLabel textKey="feat.onboarding.extra.saveImages" />
        <IconStatus
          Icon={Save}
          value={`${checkedArtwork}/${uncheckedArtwork}`}
        />
      </View>
    </View>
  );
}

//#region Helpers
const SpringConfig = { mass: 2, stiffness: 50, damping: 20 };
const SliderConfig = { initValue: 0, min: 0, roundedEndStop: true };

function ProgressLabel({ textKey }: { textKey: ParseKeys }) {
  return (
    <TStyledText textKey={textKey} numberOfLines={1} bold className="text-xs" />
  );
}

function IconStatus(props: { Icon: typeof Save; value: string | number }) {
  return (
    <View className="flex-row items-center gap-1">
      <props.Icon size={14} />
      <StyledText bold className="text-xs">
        {props.value}
      </StyledText>
    </View>
  );
}
//#endregion
