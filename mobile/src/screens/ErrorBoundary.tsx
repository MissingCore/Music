// import type { ErrorBoundaryProps } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
import Bootsplash from "react-native-bootsplash";

import { musicStore } from "~/modules/media/services/Music";
import { IssueLayout } from "~/layouts/Issue";
import { AppProvider } from "~/providers";

import { SENTRY_ENABLED, Sentry } from "~/lib/sentry";
import { Card } from "~/components/Containment/Card";
import { StyledText } from "~/components/Typography/StyledText";

/** Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: { error: Error }) {
  // export function ErrorBoundary({ error }: ErrorBoundaryProps) {
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
        <IssueLayout issueType="generic">
          <Card>
            <StyledText>{error.message}</StyledText>
          </Card>
          <StyledText dim className="text-sm">
            {error.stack}
          </StyledText>
        </IssueLayout>
      </AppProvider>
    </>
  );
}
