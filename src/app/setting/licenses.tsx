import { FlashList } from "@shopify/flash-list";
import { Pressable, Text, View } from "react-native";

import LicensesList from "@/assets/licenses.json";
import { OpenInNewOutline } from "@/assets/svgs/MaterialSymbol";

import { GITHUB_LINK } from "@/constants/Config";
import { Colors } from "@/constants/Styles";
import { AnimatedHeader } from "@/components/navigation/AnimatedHeader";
import { ExternalLink } from "@/components/navigation/ExternalLink";
import { Description, Link } from "@/features/setting/components/UI";

/** @description Screen for `/setting/licenses` route. */
export default function LicensesScreen() {
  return (
    <AnimatedHeader title="LICENSES & SOURCE">
      <Description className="mb-8">
        <Text className="font-ndot57">Music</Text> is open-source and can be
        found on GitHub with the link below.{"\n\n"}This code is published under
        the{" "}
        <ExternalLink
          href={`${GITHUB_LINK}/blob/main/LICENSE`}
          className="text-foreground100 underline"
        >
          GNU Affero General Public License v3.0
        </ExternalLink>
        .
      </Description>

      <Link href={GITHUB_LINK} iconName="logo-github" label="SOURCE CODE" />

      <View className="mb-6 border-t border-surface700" />

      <Description className="mb-8">
        This project couldn't have been made without the help of the
        open-sourced projects listed below.
      </Description>

      <FlashList
        // Median between `36` (min height) & `52` (max height). At `36`,
        // later items "glitch" into view.
        estimatedItemSize={44}
        data={LicensesList}
        keyExtractor={({ name }) => name}
        renderItem={({ item }) => (
          <ExternalLink href={item.licenseLink ?? item.repositoryLink} asChild>
            <Pressable className="mb-4 flex-row items-center justify-between gap-2 active:opacity-75">
              <View className="shrink">
                <Text className="shrink font-geistMono text-sm text-foreground50">
                  {item.name}
                </Text>
                <Text className="shrink font-geistMonoLight text-sm text-foreground100">
                  {item.licenseType}{" "}
                  <Text className="text-surface400">
                    ({item.installedVersion})
                  </Text>
                </Text>
              </View>
              <OpenInNewOutline size={24} color={Colors.surface400} />
            </Pressable>
          </ExternalLink>
        )}
        showsVerticalScrollIndicator={false}
      />
    </AnimatedHeader>
  );
}
