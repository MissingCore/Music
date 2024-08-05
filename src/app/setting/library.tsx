import { StorageVolumesDirectoryPaths } from "@missingcore/react-native-metadata-retriever";
import { FlashList } from "@shopify/flash-list";
import { Pressable, Text, View } from "react-native";

import {
  CloseOutline,
  CreateNewFolderOutline,
} from "@/assets/svgs/MaterialSymbol";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import {
  NavLinkGroupHeading,
  NavLinkLabel,
} from "@/components/navigation/nav-link";
import { StyledPressable } from "@/components/ui/pressable";
import { Description } from "@/components/ui/text";

const EXAMPLE_PATHS = ["/storage/emulated/0/Music", "/storage/ace-999/Music"];

/** Screen for `/setting/library` route. */
export default function LibraryScreen() {
  return (
    <AnimatedHeader title="Library">
      <Description intent="setting">
        Control where music is discovered from. Blocklisted directories take
        priority over allowlisted ones. If the allowlist is empty, it defaults
        to the following values:{"\n"}
        <Text className="text-foreground100">
          {StorageVolumesDirectoryPaths.map((path) => `\n\t${path}`)}
        </Text>
        {"\n\n"}
        <Text className="text-accent50">
          App relaunch is required to apply changes.
        </Text>
      </Description>

      <PathList
        name="Allowlist"
        data={EXAMPLE_PATHS}
        onDelete={(entry: string) => console.log(`Deleting \`${entry}\`...`)}
      />
      <PathList
        name="Blocklist"
        data={[]}
        onDelete={(entry: string) => console.log(`Deleting \`${entry}\`...`)}
      />
    </AnimatedHeader>
  );
}

/** Interface for adding & removing paths from an allowlist or blocklist. */
function PathList({
  name,
  data,
  onDelete,
}: {
  name: string;
  data: string[];
  onDelete: (entry: string) => void;
}) {
  return (
    <>
      <View className="mt-6 h-px bg-surface850" />

      <View className="mb-1 flex-row justify-between gap-2">
        <NavLinkGroupHeading className="mt-6">
          {name.toUpperCase()}
        </NavLinkGroupHeading>
        <Pressable
          onPress={() => console.log("Adding new item to list...")}
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
              <StyledPressable forIcon onPress={() => onDelete(item)}>
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
