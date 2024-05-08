import { router } from "expo-router";
import { Text, View } from "react-native";

import { ExternalLink } from "../navigation/ExternalLink";
import { Button } from "../ui/Button";

const ReportLink = "https://github.com/MissingCore/Music/issues/new";

/** @description Instructions on how to report the issue displayed. */
export function ReportInstructions({
  encounterMessage,
}: {
  encounterMessage: string;
}) {
  return (
    <View className="border-t border-t-surface700 px-2 pt-4">
      <View className="gap-2 px-2">
        <Text className="font-geistLight text-sm text-foreground100">
          {encounterMessage}
        </Text>
        <Text className="font-geistLight text-sm text-foreground100">
          You can help the development of this app by reporting this issue at{" "}
          <ExternalLink
            href={ReportLink}
            className="font-geistLight text-sm text-accent50"
          >
            https://github.com/MissingCore/Music/issues/new
          </ExternalLink>
          , make sure to include this screenshot and a description of the
          process that led to this error.
        </Text>
        <Text className="font-geistLight text-xs text-foreground50">
          * Clicking on the link or report button will redirect you to an
          external website.
        </Text>
      </View>
      <View className="mt-12 flex-row justify-end gap-2 px-2">
        <Button
          theme="default"
          content="Return Home"
          onPress={() => router.navigate("/")}
        />
        <ExternalLink href={ReportLink} asChild>
          <Button theme="pop" content="Report Issue" />
        </ExternalLink>
      </View>
    </View>
  );
}
