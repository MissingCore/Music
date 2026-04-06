import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Bootsplash from "react-native-bootsplash";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { usePreferenceStore } from "~/stores/Preference/store";
import { useLoadResources } from "~/modules/scanning/hooks/useLoadResources";
import { useScanning } from "~/modules/scanning/hooks/useScanning";

import NavigationContainer from "~/navigation";
import { AppProvider } from "~/navigation/providers/AppProvider";
import { ErrorBoundary } from "~/navigation/components/ErrorBoundary";
import { OnboardingConfiguration } from "~/modules/scanning/components/OnboardingConfigurationView";
import { ScanningProgress } from "~/modules/scanning/components/ScanningProgressView";

import "~/modules/i18n"; // Make sure translations are bundled.
import { SENTRY_ENABLED, Sentry } from "~/lib/sentry";
import { bgWait } from "~/utils/promise";

if (SENTRY_ENABLED) {
  const RemovedIntegrations = new Set(["ConsoleLogs", "MobileReplay"]);

  Sentry.init({
    dsn: "https://bbd726405356cdfb20b85f5f924fd3e3@o4507687432617984.ingest.us.sentry.io/4507687447101440",
    ignoreErrors: [
      /Missing .* permissions/,
      // Expo development errors:
      "Unable to activate keep awake",
      // Error caused by user configuration:
      "No matching browser activity found",
      "non-premultiplied bitmap",
    ],
    //? Disable logging console messages in Sentry introduced in `@sentry/react-native@7.4.0`.
    integrations(integrations: Array<{ name: string }>) {
      return integrations.filter((i) => !RemovedIntegrations.has(i.name));
    },
  });
}

export default function App() {
  const { isLoaded, error } = useLoadResources();
  const completedOnboarding = usePreferenceStore((s) => s.completedOnboarding);
  const { completed, error: scanningError } = useScanning(
    isLoaded && completedOnboarding,
  );

  const OnboardingScreen = useMemo(() => {
    // Prevent flashing in `OnboardingConfiguration` when we're waiting for hydration.
    if (!isLoaded || completedOnboarding) return ScanningProgress;
    return OnboardingConfiguration;
  }, [completedOnboarding, isLoaded]);

  if (error || scanningError) {
    return (
      <>
        <View ref={handleAppLifeCycle} />
        <ErrorBoundary error={error || scanningError} />
      </>
    );
  }

  return (
    <AppProvider>
      <ErrorBoundary>
        <View ref={handleAppLifeCycle} />
        {completed && <NavigationContainer />}

        <FakeLayoutTransition unmount={completed}>
          <OnboardingScreen />
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
