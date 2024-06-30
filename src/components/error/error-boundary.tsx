import type { ErrorBoundaryProps } from "expo-router";
import { ScrollView, Text } from "react-native";

import { ReportInstructions } from "./report-instructions";
import { SafeContainer } from "../ui/container";
import { Heading } from "../ui/text";

/** @description Screen displayed when an error is thrown in a component. */
export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  /*
    `error.stack?.slice(error.message.length + 8)` returns the rest of
    the stack trace; `+ 8` for `Error: ` at the beginning and the newline
    character (`\n`) at the end.
  */
  return (
    <SafeContainer className="my-8 flex-1 px-4">
      <Heading as="h1" className="mb-4">
        Something Went Wrong
      </Heading>
      <ScrollView contentContainerClassName="px-4 py-2">
        <Text className="font-geistMono text-sm text-accent50">
          {error.message}
        </Text>
        <Text className="font-geistMono text-xs text-foreground100">
          {error.stack?.slice(error.message.length + 8)}
        </Text>
      </ScrollView>
      <ReportInstructions encounterMessage="You encountered an unexpected error that occurred in production." />
    </SafeContainer>
  );
}
