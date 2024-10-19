import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "@/resources/icons";
import LicensesList from "@/resources/licenses.json";
import { StickyActionHeader } from "@/layouts/StickyActionLayout";

import { Card } from "@/components/new/Card";
import { Ripple } from "@/components/new/Form";
import { StyledText } from "@/components/new/Typography";

/** Screen for `/setting/third-party/[id]` route. */
export default function PackageLicenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  const licenseInfo = LicensesList[id as keyof typeof LicensesList];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Ripple
              preset="icon"
              accessibilityLabel={t("template.entrySeeMore", {
                name: licenseInfo.name,
              })}
              onPress={() => WebBrowser.openBrowserAsync(licenseInfo.source)}
            >
              <OpenInNew />
            </Ripple>
          ),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="grow gap-6 p-4"
      >
        <StickyActionHeader noOffset originalText>
          {licenseInfo.name}
        </StickyActionHeader>

        <Card className="bg-foreground/5">
          <StyledText preset="dimOnCanvas">
            {`${licenseInfo.version}\n\n`}
            This component is licensed under the {licenseInfo.license} license.
            {`\n\n${licenseInfo.copyright}`}
          </StyledText>
        </Card>
        <StyledText preset="dimOnCanvas">{licenseInfo.licenseText}</StyledText>
      </ScrollView>
    </>
  );
}
