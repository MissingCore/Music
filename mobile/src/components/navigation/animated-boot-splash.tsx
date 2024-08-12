import { useAtomValue } from "jotai";
import { unwrap } from "jotai/utils";
import { Dimensions, Text, View } from "react-native";
import BootSplash from "react-native-bootsplash";
import Animated, {
  FadeOut,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { indexStatusAtom } from "@/features/indexing/api/index-audio";

import { Colors } from "@/constants/Styles";
import { createAtomWithStorage } from "@/lib/jotai";
import { cn } from "@/lib/style";
import { SafeContainer } from "../ui/container";
import { AnimatedTextEllipsis } from "../ui/loading";

const descriptionTextStyle = "text-center font-geistMonoLight text-xs";

const shownIntroModalAsyncAtom = createAtomWithStorage<boolean | undefined>(
  "shown-intro-modal",
  undefined,
);
export const shownIntroModalAtom = unwrap(
  shownIntroModalAsyncAtom,
  (prev) => prev,
);

/** Screen when we're saving tracks into the database. */
export function AnimatedBootSplash() {
  const { errors, previouslyFound, staged, unstaged } =
    useAtomValue(indexStatusAtom);
  const { container, logo } = BootSplash.useHideAnimation({
    manifest: require("../../../assets/bootsplash/manifest.json"),
    logo: require("../../../assets/bootsplash/logo.png"),

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
        style={[{ width: Dimensions.get("window").width - 64 }, opacity]}
        className="absolute bottom-16 left-8"
      >
        <View className="mb-2 flex-row items-center justify-center">
          <Text className="font-geistMono text-lg text-foreground50">
            Preparing App
          </Text>
          <AnimatedTextEllipsis
            color={Colors.foreground50}
            textClass="font-geistMono text-lg"
          />
        </View>
        <Text className={cn("text-foreground50", descriptionTextStyle)}>
          {staged ?? "—"}/{unstaged ?? "—"} Saved/Updated | {errors ?? "—"}{" "}
          Errors
        </Text>
        <Text className={cn("mb-4 text-surface400", descriptionTextStyle)}>
          {previouslyFound ?? "—"} Previously Saved
        </Text>

        <Text className={cn("text-foreground100", descriptionTextStyle)}>
          This may take a while depending on the number of new tracks
          discovered, the amount of content deleted, or if the app is fixing
          some data.
        </Text>
      </Animated.View>
    </SafeContainer>
  );
}
