import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "~/icons/OpenInNew";
import LicensesList from "~/resources/licenses.json";
import { useTheme } from "~/hooks/useTheme";
import { StandardScrollLayout } from "~/layouts/StandardScroll";
import { StickyActionHeader } from "~/layouts/StickyActionScroll";

import { Card } from "~/components/Containment/Card";
import { IconButton } from "~/components/Form/Button";
import { StyledText } from "~/components/Typography/StyledText";

/** Screen for `/setting/third-party/[id]` route. */
export default function PackageLicenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const licenseInfo = LicensesList[id as keyof typeof LicensesList];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              kind="ripple"
              accessibilityLabel={t("template.entrySeeMore", {
                name: licenseInfo.name,
              })}
              onPress={() => WebBrowser.openBrowserAsync(licenseInfo.source)}
            >
              <OpenInNew />
            </IconButton>
          ),
        }}
      />
      <StandardScrollLayout contentContainerClassName="pt-2">
        <StickyActionHeader noOffset originalText>
          {licenseInfo.name}
        </StickyActionHeader>

        <Card
          className={theme === "dark" ? "bg-foreground/15" : "bg-foreground/5"}
        >
          <StyledText dim>
            {`${licenseInfo.version}\n\n`}
            This component is licensed under the {licenseInfo.license} license.
            {`\n\n${licenseInfo.copyright}`}
          </StyledText>
        </Card>
        <StyledText dim>{licenseInfo.licenseText}</StyledText>
      </StandardScrollLayout>
    </>
  );
}
