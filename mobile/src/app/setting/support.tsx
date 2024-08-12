import { Link } from "expo-router";
import { Text, View } from "react-native";

import { GITHUB_LINK } from "@/constants/Config";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import { NavLinkGroup } from "@/components/navigation/nav-link";
import { Description } from "@/components/ui/text";

const LINKGROUPS = {
  github: {
    name: "GITHUB",
    links: [
      {
        label: "SUBMIT AN ISSUE",
        href: `${GITHUB_LINK}/issues/new`,
        external: true,
      },
      {
        label: "ASK THE COMMUNITY",
        href: `${GITHUB_LINK}/discussions/new?category=q-a`,
        external: true,
      },
      {
        label: "SHARE AN IDEA",
        href: `${GITHUB_LINK}/discussions/new?category=ideas`,
        external: true,
      },
    ],
    listClassName: "-mx-4",
  },
  other: {
    name: "OTHER",
    links: [
      {
        label: "EMAIL THE DEVELOPER",
        href: "mailto:missingcoredev@outlook.com",
        external: true,
      },
    ],
    listClassName: "-mx-4",
  },
};

/** Screen for `/setting/support` route. */
export default function SupportScreen() {
  return (
    <AnimatedHeader title="SUPPORT">
      <Description intent="setting">
        Find a problem with the app or want to discuss something? Click the link
        that fits your needs below.
        {"\n\n"}
        <Text className="underline">Note:</Text> Some of the support related
        request methods require a GitHub account and will be public, so try not
        to post any personally identifiable information. In addition, you should
        review{" "}
        <Link
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          className="text-foreground100 underline"
        >
          GitHub's Privacy Policy
        </Link>
        .
      </Description>
      <View className="my-6 h-px bg-surface850" />
      <NavLinkGroup {...LINKGROUPS.github} />
      <View className="mb-6 mt-2 h-px bg-surface850" />
      <NavLinkGroup {...LINKGROUPS.other} />
    </AnimatedHeader>
  );
}
