import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GITHUB } from "~/constants/Links";
import { ScrollPresets } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { AccentText } from "~/components/Typography/AccentText";
import { TStyledText } from "~/components/Typography/StyledText";

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
    <View className="flex-1">
      <Animated.ScrollView
        contentContainerClassName="grow gap-6 p-4"
        {...ScrollPresets}
      >
        <AccentText style={{ paddingTop: top + 16 }} className="text-4xl">
          {t(`errorScreen.${props.issueType}`)}
        </AccentText>
        <TStyledText
          dim
          textKey={`errorScreen.${props.issueType}Brief`}
          className="text-base"
        />

        {props.children}

        {/* Seems like animatd styles can't be passed to `contentContainerStyle`. */}
        <Animated.View style={bottomPad} />
      </Animated.ScrollView>
      <View className="absolute bottom-4 left-4 w-full gap-0.5 rounded-md bg-canvas">
        <Button
          onLayout={(e) => {
            reportButtonHeight.value = e.nativeEvent.layout.height;
          }}
          onPress={() => WebBrowser.openBrowserAsync(`${GITHUB}/issues`)}
          style={{ maxWidth: ScreenWidth - 32 }}
          className="bg-red"
        >
          <TStyledText
            textKey="errorScreen.report"
            className="text-center text-neutral100"
          />
          <TStyledText
            textKey="errorScreen.screenshot"
            className="text-center text-xs text-neutral100/80"
          />
        </Button>
      </View>
    </View>
  );
}
