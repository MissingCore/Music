import { Link as ExpoLink } from "expo-router";
import { Text, View } from "react-native";

import { GITHUB_LINK } from "@/constants/Config";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import { Description, Link } from "@/features/setting/components/UI";

/** @description Screen for `/setting/support` route. */
export default function SupportScreen() {
  return (
    <AnimatedHeader title="SUPPORT">
      <Description className="mb-8">
        Find a problem with the app? Click the link that fits your needs below.
        {"\n\n"}
        <Text className="underline">Note:</Text> Some of the support related
        request methods require a GitHub account and will be public, so{" "}
        {"don't"} post any personally identifiable information. In addition, you
        should review{" "}
        <ExpoLink
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          className="text-foreground100 underline"
        >
          GitHub's Privacy Policy
        </ExpoLink>
        .
      </Description>

      <Link
        href={`${GITHUB_LINK}/issues/new`}
        iconName="logo-github"
        label="SUBMIT AN ISSUE"
      />
      <Link
        href={`${GITHUB_LINK}/discussions/new?category=q-a`}
        iconName="logo-github"
        label="HAVE A QUESTION?"
      />
      <Link
        href={`${GITHUB_LINK}/discussions/new?category=ideas`}
        iconName="logo-github"
        label="HAVE A FEATURE REQUEST?"
      />

      <View className="mb-6 border-t border-surface700" />

      <Link
        href="mailto:missingcoredev@outlook.com"
        iconName="mail-outline"
        label="SEND AN EMAIL"
        external={false}
      />
    </AnimatedHeader>
  );
}
