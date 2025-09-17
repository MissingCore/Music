// import type { ErrorBoundaryProps } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { View } from "react-native";
import Bootsplash from "react-native-bootsplash";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { musicStore } from "~/modules/media/services/Music";
import { useFloatingContent } from "~/hooks/useFloatingContent";
import { AppProvider } from "~/providers";

import { GITHUB } from "~/constants/Links";
import { SENTRY_ENABLED, Sentry } from "~/lib/sentry";
import { Card } from "~/components/Containment/Card";
import { ScrollView } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { AccentText } from "~/components/Typography/AccentText";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

/** Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: { error: Error }) {
  // export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { onLayout, offset, wrapperStyling } = useFloatingContent();

  const onError = useCallback(() => {
    // Display error message to user if encountered.
    Bootsplash.hide();
    musicStore.getState().resetOnCrash();

    // Send error message to Sentry.
    if (SENTRY_ENABLED && !__DEV__) Sentry.captureException(error);

    return () => {};
  }, [error]);

  return (
    <>
      <View ref={onError} />
      <AppProvider>
        <View className="relative flex-1">
          <ScrollView
            contentContainerStyle={{ paddingBottom: offset }}
            contentContainerClassName="grow gap-6 p-4"
          >
            <AccentText style={{ paddingTop: top + 16 }} className="text-4xl">
              {t("err.flow.generic.title")}
            </AccentText>
            <TStyledText
              dim
              textKey="err.flow.generic.brief"
              className="text-base"
            />
            <Card>
              <StyledText>{error.message}</StyledText>
            </Card>
            <StyledText dim className="text-sm">
              {error.stack}
            </StyledText>
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
      </AppProvider>
    </>
  );
}
