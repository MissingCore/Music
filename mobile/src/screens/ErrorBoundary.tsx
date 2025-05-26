import type { ErrorBoundaryProps } from "expo-router";
import { View } from "react-native";

import { musicStore } from "~/modules/media/services/Music";
import { IssueLayout } from "~/layouts/Issue";
import { AppProvider } from "~/providers";

import { Card } from "~/components/Containment/Card";
import { StyledText } from "~/components/Typography/StyledText";

/** Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: ErrorBoundaryProps) {
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

function onError(node: any) {
  if (node !== null) musicStore.getState().resetOnCrash();
}
