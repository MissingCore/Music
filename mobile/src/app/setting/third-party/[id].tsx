import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "@/resources/icons";
import LicensesList from "@/resources/licenses.json";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";

import { Card } from "@/components/new/Card";
import { StyledPressable } from "@/components/new/StyledPressable";
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
            <StyledPressable
              accessibilityLabel={t("template.entrySeeMore", {
                name: licenseInfo.name,
              })}
              onPress={() => WebBrowser.openBrowserAsync(licenseInfo.source)}
              forIcon
            >
              <OpenInNew />
            </StyledPressable>
          ),
        }}
      />
      <StickyActionLayout title={licenseInfo.name}>
        <Card className="gap-2 bg-foreground/5">
          <StyledText preset="dimOnCanvas">{licenseInfo.version}</StyledText>
          <StyledText preset="dimOnCanvas">
            This component is licensed under the {licenseInfo.license} license.
          </StyledText>
          <StyledText preset="dimOnCanvas">{licenseInfo.copyright}</StyledText>
        </Card>

        <StyledText preset="dimOnCanvas">{licenseInfo.licenseText}</StyledText>
      </StickyActionLayout>
    </>
  );
}
