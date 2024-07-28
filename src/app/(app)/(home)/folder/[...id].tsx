import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { ScrollView, View } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";
import { FolderOutline } from "@/assets/svgs/MaterialSymbol";
import { useFolderContentForPath } from "@/api/file-nodes/[...id]";
import { folderPathAtom } from "./_layout";

import { ActionButton } from "@/components/form/action-button";
import { Description } from "@/components/ui/text";
import { Track } from "@/features/track/components/track";

/** Screen for `/folder/[id]` route. */
export default function FolderScreen() {
  const { id = ["storage/emulated/0/Music"] } = useLocalSearchParams<{
    id: string[];
  }>();
  const updateFolderPath = useSetAtom(folderPathAtom);

  useEffect(() => {
    updateFolderPath(id);
  }, [id, updateFolderPath]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="grow pt-2"
    >
      <FolderContents
        currPath={id.map((segment) => encodeURIComponent(segment)).join("/")}
      />
    </ScrollView>
  );
}

function FolderContents({ currPath }: { currPath: string }) {
  const { isPending, error, data } = useFolderContentForPath(
    decodeURIComponent(currPath),
  );

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <Description intent="error">Error: Directory not found</Description>
      </View>
    );
  } else if (data.subDirectories.length === 0 && data.tracks.length === 0) {
    return (
      <View className="w-full flex-1 px-4">
        <Description>Directory is empty</Description>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = {
    type: "folder",
    name: `[Folder] ${decodeURIComponent(currPath).split("/").at(-1)}`,
    id: `${decodeURIComponent(currPath)}/`,
  } as const;

  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={[...data.subDirectories, undefined, ...data.tracks]}
      keyExtractor={(_, index) => `${index}`}
      renderItem={({ item }) => {
        // Render divider if we have subdirectories & tracks.
        if (item === undefined) {
          if (data.subDirectories.length > 0 && data.tracks.length > 0)
            return <View className="mb-2 h-px bg-surface850" />;
          else return null;
        }
        return (
          <View className="mb-2">
            {isTrackContent(item) ? (
              <Track {...{ ...item, trackSource }} />
            ) : (
              <ActionButton
                onPress={() => router.push(`/folder/${currPath}/${item.name}`)}
                textContent={[item.name, null]}
                Image={
                  <View className="pointer-events-none rounded-sm bg-surface800 p-1">
                    <FolderOutline size={40} />
                  </View>
                }
                icon={{ Element: <ArrowRight size={24} /> }}
              />
            )}
          </View>
        );
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
}

function isTrackContent(data: unknown): data is Track.Content {
  return (data as Track.Content).id !== undefined;
}
