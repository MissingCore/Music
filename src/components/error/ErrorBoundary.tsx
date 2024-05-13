import type { ErrorBoundaryProps } from "expo-router";
import { ScrollView, Text } from "react-native";

import { ReportInstructions } from "@/components/error/ReportInstructions";
import { ErrorContainer, ErrorTitle } from "@/components/error/UI";

/** @description Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  /*
    `error.stack?.slice(error.message.length + 8)` returns the rest of
    the stack trace; `+ 8` for `Error: ` at the beginning and the newline
    character (`\n`) at the end.
  */
  return (
    <ErrorContainer>
      <ErrorTitle title="Something Went Wrong" />
      <ScrollView contentContainerClassName="px-4 py-2">
        <Text className="font-geistMono text-sm text-accent50">
          {error.message}
        </Text>
        <Text className="font-geistMono text-xs text-foreground100">
          {error.stack?.slice(error.message.length + 8)}
        </Text>
      </ScrollView>
      <ReportInstructions encounterMessage="You encountered an unexpected error that occurred in production." />
    </ErrorContainer>
  );
}
