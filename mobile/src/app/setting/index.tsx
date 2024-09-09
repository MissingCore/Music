import { StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { Ionicons } from "@/resources/icons";
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
    name: "アプリについて",
    links: [
      { label: "サードパーティーソフトウェア", href: "/setting/third-party" },
      { label: "ライセンス", href: "/setting/license" },
      {
        label: "プライバシーポリシー",
        href: `${GITHUB_LINK}/blob/main/PRIVACY_POLICY.md`,
        external: true,
      },
      { label: "サポート", href: "/setting/support" },
    ],
    listClassName: "-mx-4",
  },
  features: {
    name: "機能",
    links: [
      { label: "バックアップ", href: "/setting/backup" },
      { label: "解析", href: "/setting/insights" },
      { label: "ライブラリ", href: "/setting/library" },
    ],
    listClassName: "-mx-4",
  },
};

/** Screen for `/setting` route. */
export default function SettingScreen() {
  return (
    <AnimatedHeader title="設定">
      <View>
        <NavLinkGroupHeading>アップデート</NavLinkGroupHeading>
        <UpdateChecker />
      </View>
      <View className="mb-6 mt-2 h-px bg-surface850" />
      <NavLinkGroup {...LINKGROUPS.features} />
      <View className="mb-6 mt-2 h-px bg-surface850" />
      <NavLinkGroup {...LINKGROUPS.about} />
      <View className="mt-1 h-12 flex-row items-center justify-between gap-2">
        <NavLinkLabel>バージョン</NavLinkLabel>
        <NavLinkLabel className="tracking-tight text-surface400">
          {APP_VERSION}
        </NavLinkLabel>
      </View>
    </AnimatedHeader>
  );
}

/** Indicates whether we're on the latest version of the app. */
function UpdateChecker() {
  const { newUpdate, release } = useHasNewUpdate();

  if (!newUpdate) {
    return (
      <NavLinkLabel className="my-4">最新のバージョンを使用しています。</NavLinkLabel>
    );
  }

  return (
    <>
      <Markdown
        style={{
          body: {
            marginTop: 8,
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
        {`# ${release.version} が利用可能です。\n\n${release.releaseNotes}`}
      </Markdown>

      <Description intent="setting" className="my-4">
        <Text className="underline">注意:</Text> アプリの審査により、
        Play ストアでは最新のアップデートがすぐに提供されない可能性があります。
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
          Play ストア
        </Button>
      </View>
    </>
  );
}

const markdownStyles = StyleSheet.create({
  heading: {
    color: Colors.foreground50,
    fontFamily: FontFamily.geistMono,
    fontSize: FontSize.base,
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
