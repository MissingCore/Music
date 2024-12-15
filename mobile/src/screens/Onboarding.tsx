import { Dimensions } from "react-native";
import BootSplash from "react-native-bootsplash";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { useOnboardingStore } from "@/modules/scanning/services/Onboarding";

import { cn } from "@/lib/style";
import { SafeContainer, cardStyles } from "@/components/Containment";
import { StyledText, TStyledText } from "@/components/Typography";

/**
 * Informs user with what's being done while displaying the app icon. This
 * screen is to prevent the user from being able to use the app in it's
 * unoptimal state.
 */
export function OnboardingScreen() {
  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require("../../assets/bootsplash/manifest.json"),
    logo: require("../../assets/bootsplash/logo.png"),

    animate: () => {},
  });

  const opacity = useAnimatedStyle(() => ({
    opacity: withSequence(
      withTiming(0, { duration: 0 }),
      withDelay(3000, withTiming(1, { duration: 750 })),
    ),
  }));

  return (
    <SafeContainer animated {...container} exiting={FadeOut.duration(500)}>
      <Animated.Image {...logo} style={[logo.style]} />

      <Animated.View
        layout={LinearTransition}
        style={[{ width: Dimensions.get("window").width - 32 }, opacity]}
        className={cn("absolute bottom-8 left-4 gap-1", cardStyles)}
      >
        <OnboardingPhase />
      </Animated.View>
    </SafeContainer>
  );
}

function OnboardingPhase() {
  const { t } = useTranslation();
  const store = useOnboardingStore((state) => state);

  if (store.phase === "preprocess") {
    return (
      <>
        <TStyledText textKey="onboardingScreen.preprocess" />
        <TStyledText
          preset="dimOnSurface"
          textKey="onboardingScreen.preprocessBrief"
        />
      </>
    );
  } else if (store.phase === "tracks") {
    return (
      <>
        <TStyledText textKey="onboardingScreen.track" />
        <StyledText preset="dimOnSurface">
          {`${t("onboardingScreen.prevSaved", { amount: store.prevSaved })}\n\n`}
          {`${t("onboardingScreen.saved", { amount: store.staged, total: store.unstaged })}\n`}
          {`${t("onboardingScreen.errors", { amount: store.saveErrors })}`}
        </StyledText>
      </>
    );
  }

  return (
    <>
      <TStyledText textKey="onboardingScreen.image" />
      <StyledText preset="dimOnSurface">
        {`${t("onboardingScreen.checked", { amount: store.checked, total: store.unchecked })}\n`}
        {`${t("onboardingScreen.found", { amount: store.found })}`}
      </StyledText>
    </>
  );
}
