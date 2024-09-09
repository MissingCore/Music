import { StorageVolumesDirectoryPaths } from "@missingcore/react-native-metadata-retriever";
import { FlashList } from "@shopify/flash-list";
import { useAtom, useSetAtom } from "jotai";
import { Pressable, Text, View } from "react-native";

import { Ionicons, MaterialSymbols } from "@/resources/icons";
import { allowListAtom, blockListAtom } from "@/features/setting/api/library";
import { useRescanLibrary } from "@/features/setting/api/library-rescan";
import { settingModalAtom } from "@/modals/categories/settings/store";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import {
  NavLinkGroupHeading,
  NavLinkLabel,
} from "@/components/navigation/nav-link";
import { StyledPressable } from "@/components/ui/pressable";
import { Description, Heading } from "@/components/ui/text";

/** Screen for `/setting/library` route. */
export default function LibraryScreen() {
  const rescanLibrary = useRescanLibrary();

  return (
    <AnimatedHeader title="ライブラリ">
      <View className="mb-8 flex-row justify-between gap-4">
        <View className="shrink">
          <Heading as="h4" className="mb-4 text-start">
            再スキャン
          </Heading>
          <Description intent="setting">
            デバイス内の曲を検索します。
          </Description>
        </View>
        <Pressable
          accessibilityLabel="ライブラリを再スキャン"
          disabled={rescanLibrary.isPending}
          onPress={() => mutateGuard(rescanLibrary, undefined)}
          className="self-end rounded border border-foreground100 p-3 active:opacity-75 disabled:opacity-25"
        >
          <Ionicons name="refresh-outline" color={Colors.foreground100} />
        </Pressable>
      </View>

      <Heading as="h4" className="mb-4 text-start">
        スキャンのフィルター
      </Heading>
      <Description intent="setting" className="mb-4">
        どのディレクトリから検索をするかをコントロールします。
        ブロックリスト内のディレクトリは、許可リスト内のディレクトリよりも優先されます。
        許可リストが空の場合はデフォルトで次の値になります:{"\n"}
        <Text className="text-foreground100">
          {StorageVolumesDirectoryPaths.map((path) => `\n\t${path}`)}
        </Text>
        {"\n\n"}
        <Text className="underline">注意:</Text> ｢ディレクトリの検索｣により返される場所は、
        正確ではない可能性があります。より正確に知るには、実際のファイル URI を
        参照してください。{"\n\n"}
        <Text className="text-accent50">
          アプリを再起動で設定が適用されます。
        </Text>
      </Description>

      <PathList name="許可リスト" listAtom={allowListAtom} />
      <PathList name="ブロックリスト" listAtom={blockListAtom} />
    </AnimatedHeader>
  );
}

/** Interface for adding & removing paths from an allowlist or blocklist. */
function PathList({
  name,
  listAtom,
}: {
  name: string;
  listAtom: typeof allowListAtom;
}) {
  const [data, setData] = useAtom(listAtom);
  const openModal = useSetAtom(settingModalAtom);

  return (
    <>
      <View className="mt-2 h-px bg-surface850" />

      <View className="mb-1 flex-row justify-between gap-2">
        <NavLinkGroupHeading className="mt-6">
          {name.toUpperCase()}
        </NavLinkGroupHeading>
        <Pressable
          accessibilityLabel={｢${name}｣のディレクトリを追加}
          onPress={() =>
            openModal({ type: "filter-list", name, store: listAtom })
          }
          className="-mr-4 px-3 pb-2 pt-4 active:opacity-75"
        >
          <MaterialSymbols name="create-new-folder-outline" />
        </Pressable>
      </View>

      <View className="-mx-4">
        <FlashList
          estimatedItemSize={52} // 48px Min-Height + 4px Margin Bottom
          data={data}
          keyExtractor={(path) => path}
          renderItem={({ item, index }) => (
            <View
              className={cn(
                "flex-row items-center justify-between gap-2 pl-4",
                { "mb-1": index !== data.length - 1 },
              )}
            >
              <NavLinkLabel className="py-1">{item}</NavLinkLabel>
              <StyledPressable
                accessibilityLabel={`｢${name}｣から｢${item}｣のエントリを削除`}
                onPress={() =>
                  setData(async (prev) =>
                    (await prev).filter((path) => path !== item),
                  )
                }
                forIcon
              >
                <MaterialSymbols
                  name="close-outline"
                  color={Colors.surface400}
                />
              </StyledPressable>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <NavLinkLabel className="h-12 px-4 py-1 align-middle">
              パスがありません
            </NavLinkLabel>
          }
        />
      </View>
    </>
  );
}
