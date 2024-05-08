import type { ErrorBoundaryProps } from "expo-router";
import { ScrollView, Text } from "react-native";

import { ReportInstructions } from "@/components/error/ReportInstructions";
import { ErrorContainer, ErrorTitle } from "@/components/error/UI";

/** @description Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  return (
    <ErrorContainer>
      <ErrorTitle title="Something Went Wrong" />
      <Text className="mb-2 px-2 font-geistMono text-base text-accent50">
        Error: {error.message}
      </Text>
      <ScrollView contentContainerClassName="px-4 py-2">
        <Text className="font-geistMono text-xs text-foreground100">
          {error.stack}
        </Text>
      </ScrollView>
      <ReportInstructions encounterMessage="You encountered an unexpected error that occurred in production." />
    </ErrorContainer>
  );
}
