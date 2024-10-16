import { Stack, usePathname } from "expo-router";
import { useAtomValue } from "jotai";
import { ScrollView, Text, View } from "react-native";

import { prevRouteAtom } from "@/providers/RouteHandlers";

import { ReportInstructions } from "@/components/error/report-instructions";
import { SafeContainer } from "@/components/ui/container";
import { Heading, Code } from "@/components/ui/text";

/** Screen for unmatched route. */
export default function NotFoundScreen() {
  const pathname = usePathname();
  const prevRoute = useAtomValue(prevRouteAtom);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeContainer className="my-8 flex-1 px-4">
        <Heading as="h1" className="mb-4 font-ndot">
          Unmatched Route
        </Heading>
        <ScrollView contentContainerClassName="px-2">
          <View className="mb-2 flex-row gap-1">
            <Text className="font-geistMono text-base text-foreground50">
              Missing:
            </Text>
            <Code text={pathname} />
          </View>
          <View className="flex-row gap-1">
            <Text className="font-geistMono text-base text-foreground50">
              From:
            </Text>
            <Code text={prevRoute} />
          </View>
        </ScrollView>
        <ReportInstructions encounterMessage="You somehow navigated to an invalid route." />
      </SafeContainer>
    </>
  );
}
