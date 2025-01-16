import type { ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";

import { musicStore } from "@/modules/media/services/Music";
import { IssueLayout } from "@/layouts/Issue";
import { AppProvider } from "@/providers";

import { Card } from "@/components/Containment/Card";
import { StyledText } from "@/components/Typography/StyledText";

/** Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  useEffect(() => {
    musicStore.getState().resetOnCrash();
  }, []);

  return (
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
  );
}
