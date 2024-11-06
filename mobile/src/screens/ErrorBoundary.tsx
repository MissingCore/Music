import type { ErrorBoundaryProps } from "expo-router";

import { IssueLayout } from "@/layouts";
import { AppProvider } from "@/providers";

import { Card } from "@/components/new/Containment";
import { StyledText } from "@/components/new/Typography";

/** Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  return (
    <AppProvider>
      <IssueLayout issueType="generic">
        <Card>
          <StyledText>{error.message}</StyledText>
        </Card>
        <StyledText className="text-sm text-foreground/60">
          {error.stack}
        </StyledText>
      </IssueLayout>
    </AppProvider>
  );
}
