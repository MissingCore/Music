import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";

import { APP_VERSION, GITHUB_LINK } from "@/constants/Config";
import { BorderRadius, Colors, FontFamily, FontSize } from "@/constants/Styles";
import { Button } from "@/components/form/button";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import { NavLink } from "@/components/navigation/nav-link";
import { Description, Title } from "@/components/ui/text";

/** @description Screen for `/setting` route. */
export default function SettingScreen() {
  return (
    <AnimatedHeader title="SETTINGS">
      <View className="mb-6">
        <Title className="mb-2">UPDATES</Title>
        <UpdateChecker />
      </View>

      <NavLink href="/setting/storage" label="STORAGE & STATISTICS" />
      <NavLink href="/setting/support" label="SUPPORT" />
      <NavLink href="/setting/licenses" label="LICENSES & SOURCE" />

      <NavLink
        href={`${GITHUB_LINK}/blob/main/PRIVACY_POLICY.md`}
        label="PRIVACY POLICY"
        external
      />

      <View className="mb-6 flex-row items-center justify-between gap-2">
        <Title>VERSION</Title>
        <Description intent="setting">{APP_VERSION}</Description>
      </View>
    </AnimatedHeader>
  );
}

/** @description Indicates whether we're on the latest version of the app. */
function UpdateChecker() {
  const { newUpdate, release } = useHasNewUpdate();

  if (!newUpdate) {
    return (
      <Description intent="setting">Currently on latest version.</Description>
    );
  }

  return (
    <>
      <Markdown
        style={{
          body: {
            padding: 8,
            backgroundColor: Colors.surface800,
            color: Colors.foreground100,
            fontFamily: FontFamily.geistMonoLight,
            fontSize: FontSize.xs,
            borderRadius: BorderRadius.lg,
          },
          heading1: {
            ...markdownStyles.heading,
            marginBottom: 16,
            fontSize: FontSize.lg,
          },
          heading2: {
            ...markdownStyles.heading,
            fontSize: FontSize.lg,
            textDecorationLine: "underline",
          },
          heading3: {
            ...markdownStyles.heading,
            fontSize: FontSize.base,
          },
          heading4: {
            ...markdownStyles.heading,
            fontSize: FontSize.xs,
          },
          heading5: {
            ...markdownStyles.heading,
            fontSize: FontSize.xs,
          },
          heading6: {
            ...markdownStyles.heading,
            fontSize: 10,
          },
          bullet_list: markdownStyles.list,
          ordered_list: markdownStyles.list,
          blockquote: {
            ...markdownStyles.fence,
            marginHorizontal: 0,
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
      <View className="mt-4 flex-row gap-2">
        <Button
          interaction="external-link"
          href={`${GITHUB_LINK}/releases/tag/${release.version}`}
          theme="neutral-dark"
          Icon={
            <Ionicons
              name="logo-github"
              size={20}
              color={Colors.foreground50}
            />
          }
        >
          APK
        </Button>
      </View>
    </>
  );
}

const markdownStyles = StyleSheet.create({
  heading: {
    marginBottom: 8,
    color: Colors.foreground50,
    fontFamily: FontFamily.geistMono,
  },
  list: {
    marginVertical: 8,
  },
  code: {
    backgroundColor: Colors.surface700,
  },
  fence: {
    marginVertical: 8,
    backgroundColor: Colors.surface700,
    borderRadius: BorderRadius.sm,
  },
});
