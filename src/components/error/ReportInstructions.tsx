import { Text, View } from "react-native";

import { GITHUB_LINK } from "@/constants/Config";
import { Button } from "@/components/form/button";
import { ExternalLink } from "@/components/navigation/ExternalLink";

const ReportLink = `${GITHUB_LINK}/issues/new`;

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
          <ExternalLink href={ReportLink} className="text-accent50">
            {ReportLink}
          </ExternalLink>
          , make sure to include this screenshot and a description of the
          process that led to this error.
        </Text>
        <Text className="font-geistLight text-xs text-foreground50">
          * Clicking on the link or report button will redirect you to an
          external website.
        </Text>
      </View>
      <View className="mt-8 flex-row justify-end gap-2 px-2">
        <Button interaction="external-link" href="/" variant="outline">
          Return Home
        </Button>
        <Button interaction="external-link" href={ReportLink} theme="accent">
          Report Issue
        </Button>
      </View>
    </View>
  );
}
