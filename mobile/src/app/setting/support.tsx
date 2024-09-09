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
        label: "ISSUE を送信",
        href: `${GITHUB_LINK}/issues/new`,
        external: true,
      },
      {
        label: "コミュニティで質問する",
        href: `${GITHUB_LINK}/discussions/new?category=q-a`,
        external: true,
      },
      {
        label: "アイデアを共有する",
        href: `${GITHUB_LINK}/discussions/new?category=ideas`,
        external: true,
      },
    ],
    listClassName: "-mx-4",
  },
  other: {
    name: "その他",
    links: [
      {
        label: "開発者にメールを送る",
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
    <AnimatedHeader title="サポート">
      <Description intent="setting">
        アプリの問題を発見した場合や何か伝えたいことがある場合は、

        以下のニーズに合ったリンクを選択してください。
        {"\n\n"}
        <Text className="underline">注意:</Text> サポート関連のリクエスト方法の一部には
        GitHub アカウントが必要です。
        情報が公開されるため個人を特定できる情報を投稿しないでください。

        その他に {" "} をご確認ください。
        <Link
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          className="text-foreground100 underline"
        >
          GitHub のプライバシーポリシー
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
