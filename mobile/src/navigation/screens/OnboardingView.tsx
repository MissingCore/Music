import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions } from "react-native";
import BootSplash from "react-native-bootsplash";
import Animated, {
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { useOnboardingStore } from "~/modules/scanning/services/Onboarding";

import { SafeContainer } from "~/components/Containment/SafeContainer";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/**
 * Informs user with what's being done while displaying the app icon. This
 * screen is to prevent the user from being able to use the app in it's
 * unoptimal state.
 */
export function Onboarding() {
  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require("../../../assets/bootsplash/manifest.json"),
    logo: require("../../../assets/bootsplash/logo.png"),

    animate: () => {},
  });
  const onboardPhase = useOnboardingStore((state) => state.phase);
  const [foundPhase, setFoundPhase] = useState(false);
  const infoOpacity = useSharedValue(0);

  // We only want to trigger the opacity change when we're in an onboarding phase.
  useEffect(() => {
    if (onboardPhase && !foundPhase) {
      setFoundPhase(true);
      infoOpacity.value = withDelay(2000, withTiming(1, { duration: 750 }));
    }
  }, [foundPhase, infoOpacity, onboardPhase]);

  const opacity = useAnimatedStyle(() => ({ opacity: infoOpacity.value }));

  return (
    <SafeContainer animated {...container} exiting={FadeOut.duration(500)}>
      <Animated.Image {...logo} style={[logo.style]} />

      <Animated.View
        layout={LinearTransition}
        style={[{ width: Dimensions.get("window").width - 32 }, opacity]}
        className="absolute bottom-4 left-4 gap-1 rounded-md bg-surface p-4"
      >
        <OnboardingPhase />
      </Animated.View>
    </SafeContainer>
  );
}

function OnboardingPhase() {
  const { t } = useTranslation();
  const store = useOnboardingStore((state) => state);

  if (store.phase === undefined) {
    return null;
  } else if (store.phase === "preprocess") {
    return (
      <>
        <TStyledText textKey="feat.onboardPreprocess.title" />
        <TStyledText dim textKey="feat.onboardPreprocess.brief" />
      </>
    );
  } else if (store.phase === "tracks") {
    return (
      <>
        <TStyledText textKey="feat.onboardTracks.title" />
        <StyledText dim>
          {`${t("feat.onboardTracks.extra.prevSaved", { amount: store.prevSaved })}\n\n`}
          {`${t("feat.onboardTracks.extra.saved", { amount: store.staged, total: store.unstaged })}\n`}
          {`${t("feat.onboardTracks.extra.errors", { amount: store.saveErrors })}`}
        </StyledText>
      </>
    );
  }

  return (
    <>
      <TStyledText textKey="feat.onboardImages.title" />
      <StyledText dim>
        {`${t("feat.onboardImages.extra.checked", { amount: store.checked, total: store.unchecked })}\n`}
        {`${t("feat.onboardImages.extra.found", { amount: store.found })}`}
      </StyledText>
    </>
  );
}
