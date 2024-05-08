import { Stack, usePathname } from "expo-router";
import { useAtomValue } from "jotai";
import { ScrollView, Text, View } from "react-native";

import { prevPathnameAtom } from "@/components/error/PrevPathnameTracker";

import { ReportInstructions } from "@/components/error/ReportInstructions";
import { Code, ErrorContainer, ErrorTitle } from "@/components/error/UI";

/** @description Screen for unmatched route. */
export default function NotFoundScreen() {
  const pathname = usePathname();
  const prevPathname = useAtomValue(prevPathnameAtom);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ErrorContainer>
        <ErrorTitle title="Unmatched Route" />
        <ScrollView className="px-2">
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
            <Code text={prevPathname} />
          </View>
        </ScrollView>
        <ReportInstructions encounterMessage="You somehow navigated to an invalid route." />
      </ErrorContainer>
    </>
  );
}
