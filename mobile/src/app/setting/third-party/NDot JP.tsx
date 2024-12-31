import { Text } from "react-native";

import { StickyActionHeader } from "@/layouts";

import { Card } from "@/components/Containment";
import { ScrollView } from "@/components/Defaults";
import { StyledText } from "@/components/Typography";

/** Screen for `/setting/third-party/NDot JP` route. */
export default function PackageLicenseScreen() {
  return (
    <ScrollView contentContainerClassName="grow gap-6 p-4 pt-2">
      <StickyActionHeader noOffset originalText>
        NDot日本語
      </StickyActionHeader>

      <Card className="bg-foreground/5 dark:bg-foreground/15">
        <StyledText dim>
          {"1.2.0\n\nチーム「Nothing Japanese Font Project」"}
        </StyledText>
      </Card>
      <StyledText dim>
        {
          "このフォントを提供してくださったNothing コミュニティ チーム「Nothing Japanese Font Project」チームに心より 感謝いたします。 参加者リスト:\n\n"
        }
        {"Yuki Kondo (yukilab)\n"}
        {"水野 朔弥 / Sakuya Mizuno (rarurai3)\n"}
        {"Yuqi Takase (uqe_digiana)\n"}
        {"Yuki Shiba (shibadogcap)\n"}
        {"Kazuki Onikubo (k.check.o)\n"}
        {"はるはる / Haruto Sei (haruharu0785)\n"}
        {"貴様の死兆星が見える / Takatsune (donkypower)"}
      </StyledText>
      <Card className="bg-yellow">
        <Text className="font-roboto text-xs text-neutral0">
          {"日本語(ChatGPTで翻訳)\n"}
          {
            "残りの名前の日本語表記について、より良い帰属のためにプルリクエストを作成してください(NDOT日本語実験機能画面の名前)。"
          }
        </Text>
      </Card>
    </ScrollView>
  );
}
