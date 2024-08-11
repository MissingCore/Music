import { StorageVolumesDirectoryPaths } from "@missingcore/react-native-metadata-retriever";
import { FlashList } from "@shopify/flash-list";
import { useAtom, useSetAtom } from "jotai";
import { Pressable, Text, View } from "react-native";

import {
  CloseOutline,
  CreateNewFolderOutline,
} from "@/assets/svgs/MaterialSymbol";
import { Ionicons } from "@/components/icons";
import { allowListAtom, blockListAtom } from "@/features/setting/api/library";
import { useRescanLibrary } from "@/features/setting/api/library-rescan";
import { settingModalAtom } from "@/features/setting/store";

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
    <AnimatedHeader title="LIBRARY">
      <Heading as="h4" className="mb-4 text-start">
        Rescan Folder Structure
      </Heading>
      <View className="mb-8 flex-row gap-4">
        <Description intent="setting" className="shrink">
          Go through all the indexed tracks and re-create the structure seen in
          the `FOLDERS` tab, removing any old and unused entries.{"\n\n"}
          <Text className="text-accent50">
            This doesn't look for any new tracks. To do that, relaunch the app.
          </Text>
        </Description>
        <Pressable
          accessibilityLabel="Rescan folder structure"
          disabled={rescanLibrary.isPending}
          onPress={() => mutateGuard(rescanLibrary, undefined)}
          className="self-start rounded border border-foreground100 p-3 active:opacity-75 disabled:opacity-25"
        >
          <Ionicons name="refresh-outline" color={Colors.foreground100} />
        </Pressable>
      </View>

      <Heading as="h4" className="mb-4 text-start">
        Scan Filter
      </Heading>
      <Description intent="setting" className="mb-4">
        Control where music is discovered from. Directories in the blocklist
        have higher priority over ones in the allowlist. If the allowlist is
        empty, it defaults to the following values:{"\n"}
        <Text className="text-foreground100">
          {StorageVolumesDirectoryPaths.map((path) => `\n\t${path}`)}
        </Text>
        {"\n\n"}
        <Text className="underline">Note:</Text> The locations returned by `Find
        Directory` might not be accurate. Refer to the actual file URI for
        better accuracy.{"\n\n"}
        <Text className="text-accent50">
          App relaunch is required to apply changes.
        </Text>
      </Description>

      <PathList name="Allowlist" listAtom={allowListAtom} />
      <PathList name="Blocklist" listAtom={blockListAtom} />
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
          accessibilityLabel={`Add directory to ${name}`}
          onPress={() =>
            openModal({ type: "filter-list", name, store: listAtom })
          }
          className="-mr-4 px-3 pb-2 pt-4 active:opacity-75"
        >
          <CreateNewFolderOutline size={24} />
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
                accessibilityLabel={`Delete \`${item}\` entry from ${name}`}
                onPress={() =>
                  setData(async (prev) =>
                    (await prev).filter((path) => path !== item),
                  )
                }
                forIcon
              >
                <View className="pointer-events-none">
                  <CloseOutline size={24} color={Colors.surface400} />
                </View>
              </StyledPressable>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <NavLinkLabel className="h-12 px-4 py-1 align-middle">
              No Paths Found
            </NavLinkLabel>
          }
        />
      </View>
    </>
  );
}
