import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";

import { cn } from "~/lib/style";
import { ScrollView } from "~/components/Defaults";
import { AccentText } from "~/components/Typography/AccentText";

/** Standard scrollable layout with an option to display a title. */
export function StandardScrollLayout(props: {
  children: React.ReactNode;
  contentContainerClassName?: string;
  /** Key to title in translations. */
  titleKey?: ParseKeys;
  /** Action rendered adjacent to the title. */
  titleAction?: React.ReactNode;
}) {
  const { bottomInset } = useBottomActionsContext();
  return (
    <ScrollView
      contentContainerStyle={
        props.titleKey ? { paddingBottom: bottomInset.withNav + 16 } : undefined
      }
      contentContainerClassName={cn(
        "grow gap-6 p-4",
        props.contentContainerClassName,
      )}
    >
      {props.titleKey ? (
        <LayoutHeader
          titleKey={props.titleKey}
          titleAction={props.titleAction}
        />
      ) : undefined}
      {props.children}
    </ScrollView>
  );
}

function LayoutHeader(props: {
  titleKey: ParseKeys;
  titleAction?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: top + 16 }}
      className="flex-row items-center justify-between gap-4"
    >
      <AccentText className="text-4xl">{t(props.titleKey)}</AccentText>
      {props.titleAction ? (
        <View className="-mr-2">{props.titleAction}</View>
      ) : undefined}
    </View>
  );
}
