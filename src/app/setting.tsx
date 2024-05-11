import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { useLatestRelease } from "@/api/releases";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";
import { AnimatedHeader } from "@/components/navigation/AnimatedHeader";
import { ExternalLink } from "@/components/navigation/ExternalLink";

const APP_VERSION = "v0.0.0";
const GITHUB_LINK = "https://github.com/MissingCore/Music";

/** @description Screen for `/setting` route. */
export default function SettingScreen() {
  return (
    <AnimatedHeader title="SETTINGS">
      <Section>
        <Title>Updates</Title>
        <UpdateChecker />
      </Section>

      <Section>
        <Title>Source Code</Title>
        <View className="flex-row">
          <ExternalLink href={GITHUB_LINK} asChild>
            <Pressable
              className={cn(
                "flex-row items-center gap-2 px-2 py-1",
                "rounded-full bg-surface800 active:bg-surface700",
              )}
            >
              <Ionicons
                name="logo-github"
                size={24}
                color={Colors.foreground50}
              />
              <Text className="font-geistMonoLight text-xs text-foreground50">
                GitHub
              </Text>
            </Pressable>
          </ExternalLink>
        </View>
      </Section>
    </AnimatedHeader>
  );
}

/** @description Indicates whether we're on the latest version of the app. */
function UpdateChecker() {
  const { isPending, error, data } = useLatestRelease();

  if (isPending) return null;

  // We prefer newest stable version over release candidate (ie: `v1.0.0` over `v1.0.0-rc.1`)
  //  - `data.version` should never be a release candidate value.
  if (
    !!error ||
    !data.version ||
    data.version.includes("-rc.") ||
    data.version < APP_VERSION.split("-rc.")[0]
  ) {
    return <Description>Latest version ({APP_VERSION})</Description>;
  }

  return (
    <>
      <Markdown
        style={{
          body: {
            padding: 8,
            backgroundColor: Colors.surface800,
            color: Colors.foreground100,
            fontFamily: "GeistMonoLight",
            fontSize: 12,
            borderRadius: 16,
          },
          heading1: {
            ...markdownStyles.heading,
            marginBottom: 16,
            fontSize: 24,
          },
          heading2: {
            ...markdownStyles.heading,
            fontSize: 20,
            textDecorationLine: "underline",
          },
          heading3: { ...markdownStyles.heading, fontSize: 16 },
          heading4: { ...markdownStyles.heading, fontSize: 12 },
          heading5: { ...markdownStyles.heading, fontSize: 12 },
          heading6: { ...markdownStyles.heading, fontSize: 10 },
          bullet_list: markdownStyles.list,
          ordered_list: markdownStyles.list,
          blockquote: {
            ...markdownStyles.fence,
            marginHorizontal: 0,
            borderColor: Colors.accent500,
          },
          fence: { ...markdownStyles.fence, borderColor: Colors.surface500 },
          code_inline: markdownStyles.code,
          hr: { backgroundColor: Colors.surface700 },
        }}
        rules={{
          link: (node, children, _parent, styles) => (
            <Text key={node.key} style={styles.link}>
              {children}
            </Text>
          ),
        }}
      >
        {`# ${data.version} is Available\n\n${data.releaseNotes}`}
      </Markdown>
      <View className="mt-4 flex-row">
        <ExternalLink href={`${GITHUB_LINK}/releases/latest`} asChild>
          <Pressable
            className={cn(
              "flex-row items-center gap-2 px-2 py-1",
              "rounded-full bg-surface800 active:bg-surface700",
            )}
          >
            <Ionicons
              name="logo-github"
              size={24}
              color={Colors.foreground50}
            />
            <Text className="font-geistMonoLight text-xs text-foreground50">
              APK
            </Text>
          </Pressable>
        </ExternalLink>
      </View>
    </>
  );
}

const markdownStyles = StyleSheet.create({
  heading: {
    marginBottom: 8,
    color: Colors.foreground50,
    fontFamily: "GeistMonoMedium",
  },
  list: { marginVertical: 8 },
  code: { backgroundColor: Colors.surface700 },
  fence: {
    marginVertical: 8,
    backgroundColor: Colors.surface700,
    borderRadius: 4,
  },
});

type UIProp = { className?: string; children: React.ReactNode };

function Section({ className, children }: UIProp) {
  return <View className={cn("mb-8", className)}>{children}</View>;
}

function Title({ className, children }: UIProp) {
  return (
    <Text
      className={cn(
        "mb-1.5 font-geistMonoLight text-lg text-foreground100",
        className,
      )}
    >
      {children}
    </Text>
  );
}

function Description({ className, children }: UIProp) {
  return (
    <Text
      className={cn("font-geistMono text-base text-foreground50", className)}
    >
      {children}
    </Text>
  );
}
