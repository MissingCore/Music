// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { useEffect } from "react";
import { Dimensions, View } from "react-native";
import BootSplash from "react-native-bootsplash";
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useScanningProgressStore } from "../scanning/ScanningProgress";

import type { SupportedIconName } from "~/components/next/base/icon";
import { Icon } from "~/components/next/base/icon";
import { Text, TText } from "~/components/next/base/typography";
import { SystemTheme } from "~/modules/customization/theme/core/constants";

export function ScanningProgress() {
  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require("../../../../assets/dark/bootsplash/manifest.json"),
    logo: require("../../../../assets/light/bootsplash/logo.png"),
    darkLogo: require("../../../../assets/dark/bootsplash/logo.png"),

    animate: () => {},
  });
  return (
    <Animated.View {...container}>
      <Animated.Image {...logo} />
      <Animated.View
        layout={LinearTransition}
        style={{ width: Dimensions.get("window").width - 32 }}
        className="absolute bottom-safe-offset-8 left-4 gap-4"
      >
        <TracksSavingProgress />
        <ArtworkSavingProgress />
      </Animated.View>
    </Animated.View>
  );
}

function TracksSavingProgress() {
  const scannedTracks = useScanningProgressStore((s) => s.scannedTracks);
  const modifiedTracks = useScanningProgressStore((s) => s.modifiedTracks);
  const failedTrackScans = useScanningProgressStore((s) => s.failedTrackScans);

  if (modifiedTracks === 0) return null;
  return (
    <View className="gap-2">
      <ProgressBar
        currVal={scannedTracks + failedTrackScans}
        max={modifiedTracks}
      />
      <View className="flex-row items-center justify-between">
        <ProgressLabel textKey="feat.onboarding.extra.saveTracks" />
        <View className="flex-row items-center gap-2">
          <IconStatus
            icon="save"
            value={
              scannedTracks + failedTrackScans === modifiedTracks
                ? scannedTracks
                : `${scannedTracks}/${modifiedTracks}`
            }
          />
          <IconStatus icon="warning" value={failedTrackScans} />
        </View>
      </View>
    </View>
  );
}

function ArtworkSavingProgress() {
  const checkedArtwork = useScanningProgressStore((s) => s.checkedArtwork);
  const uncheckedArtwork = useScanningProgressStore((s) => s.uncheckedArtwork);

  if (uncheckedArtwork === 0) return null;
  return (
    <View className="gap-2">
      <ProgressBar currVal={checkedArtwork} max={uncheckedArtwork} />
      <View className="grow flex-row items-center justify-between">
        <ProgressLabel textKey="feat.onboarding.extra.saveImages" />
        <IconStatus
          icon="save"
          value={`${checkedArtwork}/${uncheckedArtwork}`}
        />
      </View>
    </View>
  );
}

//#region Helpers
function ProgressBar({ currVal, max }: { currVal: number; max: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withSpring(currVal, { mass: 2, stiffness: 50, damping: 20 }));
  }, [progress, currVal]);

  const animatedStyles = useAnimatedStyle(() => ({
    //? This method is required as `withSpring` doesn't work with decimals.
    width: `${(progress.get() / max) * 100}%`,
    backgroundColor: SystemTheme.primary,
  }));

  return (
    <Animated.View
      collapsable={false}
      style={{ backgroundColor: SystemTheme.surfaceContainerLowest }}
      className="h-3 w-full items-start overflow-hidden rounded-full"
    >
      <Animated.View
        collapsable={false}
        style={animatedStyles}
        className="h-full rounded-r-full"
      />
    </Animated.View>
  );
}

function ProgressLabel({ textKey }: { textKey: ParseKeys }) {
  return (
    <TText
      textKey={textKey}
      numberOfLines={1}
      intent="em"
      size="xs"
      style={{ color: SystemTheme.onSurface }}
    />
  );
}

function IconStatus(props: {
  icon: SupportedIconName;
  value: string | number;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={props.icon} size={14} color={SystemTheme.onSurface} />
      <Text bold size="xxs" style={{ color: SystemTheme.onSurface }}>
        {props.value}
      </Text>
    </View>
  );
}
//#endregion
