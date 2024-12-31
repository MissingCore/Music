import type { ErrorBoundaryProps } from "expo-router";

import { IssueLayout } from "@/layouts/Issue";
import { AppProvider } from "@/providers";

import { Card } from "@/components/Containment";
import { StyledText } from "@/components/Typography";

/** Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: ErrorBoundaryProps) {
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
