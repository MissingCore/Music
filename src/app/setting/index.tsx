import { StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { Ionicons } from "@/components/icons";
import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";

import { APP_VERSION, GITHUB_LINK, PLAYSTORE_LINK } from "@/constants/Config";
import { BorderRadius, Colors, FontFamily, FontSize } from "@/constants/Styles";
import { Button } from "@/components/form/button";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import {
  NavLinkGroup,
  NavLinkGroupHeading,
  NavLinkLabel,
} from "@/components/navigation/nav-link";
import { Description } from "@/components/ui/text";

const LINKGROUPS = {
  about: {
    name: "ABOUT",
    links: [
      { label: "THIRD-PARTY SOFTWARE", href: "/setting/third-party" },
      { label: "LICENSE", href: "/setting/license" },
      {
        label: "PRIVACY POLICY",
        href: `${GITHUB_LINK}/blob/main/PRIVACY_POLICY.md`,
        external: true,
      },
      { label: "SUPPORT", href: "/setting/support" },
    ],
    listClassName: "-mx-4",
  },
  features: {
    name: "FEATURES",
    links: [
      { label: "BACKUP", href: "/setting/backup" },
      { label: "INSIGHTS", href: "/setting/insights" },
    ],
    listClassName: "-mx-4",
  },
};

/** @description Screen for `/setting` route. */
export default function SettingScreen() {
  return (
    <AnimatedHeader title="SETTINGS">
      <View>
        <NavLinkGroupHeading>UPDATES</NavLinkGroupHeading>
        <UpdateChecker />
      </View>
      <View className="mb-6 mt-2 h-px bg-surface850" />
      <NavLinkGroup {...LINKGROUPS.features} />
      <View className="mb-6 mt-2 h-px bg-surface850" />
      <NavLinkGroup {...LINKGROUPS.about} />
      <View className="mt-1 h-12 flex-row items-center justify-between gap-2">
        <NavLinkLabel>VERSION</NavLinkLabel>
        <NavLinkLabel className="tracking-tight text-surface400">
          {APP_VERSION}
        </NavLinkLabel>
      </View>
    </AnimatedHeader>
  );
}

/** @description Indicates whether we're on the latest version of the app. */
function UpdateChecker() {
  const { newUpdate, release } = useHasNewUpdate();

  if (!newUpdate) {
    return (
      <NavLinkLabel className="my-4">Currently on latest version.</NavLinkLabel>
    );
  }

  return (
    <>
      <Markdown
        style={{
          body: {
            marginTop: 16,
            padding: 8,
            gap: 8,
            backgroundColor: Colors.surface800,
            color: Colors.foreground100,
            fontFamily: FontFamily.geistMonoLight,
            fontSize: 10,
            borderRadius: BorderRadius.lg,
          },
          heading1: {
            ...markdownStyles.heading,
            fontSize: FontSize.lg,
            textDecorationLine: "none",
          },
          heading2: markdownStyles.heading,
          paragraph: {
            marginTop: 0,
            marginBottom: 0,
          },
          blockquote: {
            ...markdownStyles.fence,
            borderColor: Colors.accent500,
          },
          fence: {
            ...markdownStyles.fence,
            borderColor: Colors.surface500,
          },
          code_inline: markdownStyles.code,
          hr: {
            backgroundColor: Colors.surface700,
          },
        }}
        rules={{
          link: (node, children, _parent, styles) => (
            <Text key={node.key} style={styles.link}>
              {children}
            </Text>
          ),
        }}
      >
        {`# ${release.version} is Available\n\n${release.releaseNotes}`}
      </Markdown>

      <Description intent="setting" className="my-4">
        <Text className="underline">Note:</Text> The Play Store may not have the
        latest update immediately due to the app being in review.
      </Description>

      <View className="mb-4 flex-row gap-2">
        <Button
          interaction="external-link"
          href={`${GITHUB_LINK}/releases/tag/${release.version}`}
          theme="neutral-dark"
          Icon={<Ionicons name="logo-github" size={20} />}
        >
          APK
        </Button>
        <Button
          interaction="external-link"
          href={PLAYSTORE_LINK}
          theme="neutral-dark"
          Icon={<Ionicons name="logo-google-playstore" size={20} />}
        >
          Play Store
        </Button>
      </View>
    </>
  );
}

const markdownStyles = StyleSheet.create({
  heading: {
    color: Colors.foreground50,
    fontFamily: FontFamily.geistMono,
    fontSize: FontSize.sm,
    textDecorationLine: "underline",
  },
  code: {
    backgroundColor: Colors.surface700,
  },
  fence: {
    padding: 4,
    margin: 0,
    backgroundColor: Colors.surface700,
    borderRadius: BorderRadius.sm,
  },
});
