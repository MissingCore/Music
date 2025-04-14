import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
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
  /**
   * Whether this is used on the home screen, which need extra padding
   * to account for the navbar and miniplayer.
   */
  forHomeScreen?: boolean;
}) {
  const { bottomInset } = useBottomActionsContext();
  return (
    <ScrollView
      contentContainerStyle={
        props.forHomeScreen
          ? { paddingBottom: bottomInset.withNav + 16 }
          : undefined
      }
      contentContainerClassName={cn(
        "grow gap-6 p-4",
        props.contentContainerClassName,
      )}
    >
      {props.titleKey ? <LayoutHeader titleKey={props.titleKey} /> : undefined}
      {props.children}
    </ScrollView>
  );
}

function LayoutHeader({ titleKey }: { titleKey: ParseKeys }) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  return (
    <AccentText style={{ paddingTop: top + 16 }} className="text-4xl">
      {t(titleKey)}
    </AccentText>
  );
}
