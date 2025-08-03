import { openBrowserAsync } from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFloatingContent } from "~/hooks/useFloatingContent";

import { GITHUB } from "~/constants/Links";
import { ScrollView } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { AccentText } from "~/components/Typography/AccentText";
import { TStyledText } from "~/components/Typography/StyledText";

/** Layout used for the "error" screens (route & unexpected errors). */
export function IssueLayout(props: {
  issueType: "route" | "generic";
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { onLayout, offset, wrapperStyling } = useFloatingContent();

  return (
    <View className="relative flex-1">
      <ScrollView
        contentContainerStyle={{ paddingBottom: offset }}
        contentContainerClassName="grow gap-6 p-4"
      >
        <AccentText style={{ paddingTop: top + 16 }} className="text-4xl">
          {t(`err.flow.${props.issueType}.title`)}
        </AccentText>
        <TStyledText
          dim
          textKey={`err.flow.${props.issueType}.brief`}
          className="text-base"
        />
        {props.children}
      </ScrollView>
      <View onLayout={onLayout} {...wrapperStyling}>
        <Button
          onPress={() => openBrowserAsync(`${GITHUB}/issues`)}
          className="w-full bg-red"
        >
          <TStyledText
            textKey="err.flow.report.title"
            className="text-center text-neutral100"
          />
          <TStyledText
            textKey="err.flow.report.brief"
            className="text-center text-xs text-neutral100/80"
          />
        </Button>
      </View>
    </View>
  );
}
