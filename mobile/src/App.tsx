import TrackPlayer from "@weights-ai/react-native-track-player";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Bootsplash from "react-native-bootsplash";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { preferenceStore } from "~/stores/Preference/store";
import { useLoadResources } from "~/hooks/useLoadResources";
import NavigationContainer from "~/navigation";
import { AppProvider } from "~/navigation/providers/AppProvider";
import { ErrorBoundary } from "~/navigation/components/ErrorBoundary";
import { Onboarding } from "~/navigation/screens/OnboardingView";

import "./global.css";
import "~/modules/i18n"; // Make sure translations are bundled.
import { SENTRY_ENABLED, Sentry } from "~/lib/sentry";
import { bgWait } from "~/utils/promise";

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: "https://bbd726405356cdfb20b85f5f924fd3e3@o4507687432617984.ingest.us.sentry.io/4507687447101440",
    ignoreErrors: [
      /Missing .* permissions/,
      // Expo development errors:
      "Unable to activate keep awake",
    ],
  });
}

export default function App() {
  const { isLoaded, error } = useLoadResources();

  if (error) {
    return (
      <>
        <View ref={handleAppLifeCycle} />
        <ErrorBoundary error={error} />
      </>
    );
  }

  return (
    <AppProvider>
      <ErrorBoundary>
        <View ref={handleAppLifeCycle} />
        {isLoaded && <NavigationContainer />}

        <FakeLayoutTransition unmount={isLoaded}>
          <Onboarding />
        </FakeLayoutTransition>
      </ErrorBoundary>
    </AppProvider>
  );
}

function handleAppLifeCycle() {
  // Encountered issue in Android 12+ where one of the bootsplashes
  // persisted when it shouldn't. Make sure we close at least the bootsplash
  // from `react-native-bootsplash` whenever we render the app (in case its
  // "autohide" behavior doesn't work as expected).
  //  - Delay to prevent flicker from change in how onboarding screen is shown.
  bgWait(1).then(() => Bootsplash.hide());

  // Ensure the RNTP service gets destroyed on app close.
  return () => {
    if (!preferenceStore.getState().continuePlaybackOnDismiss) {
      TrackPlayer.reset().catch();
    }
  };
}

//#region Layout Transition
type TransitionState = "idle" | "in-progress" | "finished";

function FakeLayoutTransition(props: {
  children: React.ReactNode;
  unmount?: boolean;
}) {
  const [animState, setAnimState] = useState<TransitionState>("idle");
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!props.unmount || animState !== "idle") return;
    setAnimState("in-progress");
    opacity.value = withDelay(
      500,
      withTiming(0, { duration: 500 }, () => {
        scheduleOnRN(setAnimState, "finished");
      }),
    );
  }, [props.unmount, animState, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (animState === "finished") return null;
  return (
    <Animated.View style={animatedStyle} className="absolute inset-0">
      {props.children}
    </Animated.View>
  );
}
//#endregion
