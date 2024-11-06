import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GITHUB } from "@/constants/Links";
import { Button } from "@/components/new/Form";
import { AccentText, StyledText } from "@/components/new/Typography";

/** Layout used for the "error" screens (route & unexpected errors). */
export function IssueLayout(props: {
  issueType: "unmatched" | "generic";
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { width: ScreenWidth } = useWindowDimensions();

  const reportButtonHeight = useSharedValue(0);

  const bottomPad = useAnimatedStyle(() => ({
    paddingBottom: reportButtonHeight.value,
  }));

  return (
    <>
      <Animated.ScrollView contentContainerClassName="grow gap-6 p-4">
        <AccentText style={{ paddingTop: top + 16 }} className="text-3xl">
          {t(`errorScreen.${props.issueType}`)}
        </AccentText>
        <StyledText preset="dimOnCanvas" className="text-base">
          {t(`errorScreen.${props.issueType}Brief`)}
        </StyledText>

        {props.children}

        {/* Seems like animatd styles can't be passed to `contentContainerStyle`. */}
        <Animated.View style={bottomPad} />
      </Animated.ScrollView>
      <Button
        onLayout={(e) => {
          reportButtonHeight.value = e.nativeEvent.layout.height;
        }}
        onPress={() => WebBrowser.openBrowserAsync(`${GITHUB}/issues`)}
        style={{ maxWidth: ScreenWidth - 32 }}
        className="absolute bottom-4 left-4 w-full gap-0.5 bg-red"
      >
        <StyledText center className="text-neutral100">
          {t("errorScreen.report")}
        </StyledText>
        <StyledText center className="text-xs text-neutral100/80">
          {t("errorScreen.screenshot")}
        </StyledText>
      </Button>
    </>
  );
}
