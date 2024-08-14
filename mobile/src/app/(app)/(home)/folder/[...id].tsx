import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { ScrollView, View } from "react-native";

import { MaterialSymbols } from "@/resources/icons";
import { ArrowRight } from "@/resources/icons/ArrowRight";
import { useFolderContentForPath } from "@/api/file-nodes/[...id]";
import { folderPathAtom } from "./_layout";

import { ActionButton } from "@/components/form/action-button";
import { LoadingIndicator } from "@/components/ui/loading";
import { Description } from "@/components/ui/text";
import { Track } from "@/features/track/components/track";

/** Screen for `/folder/[id]` route. */
export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string[] }>();
  const navigation = useNavigation();
  const updateFolderPath = useSetAtom(folderPathAtom);

  const fullPath = id?.join("/");

  const { isPending, error, data } = useFolderContentForPath(fullPath);

  useEffect(() => {
    function onFocus() {
      updateFolderPath(id ?? []);
    }
    // Update breadcrumb (whenever we navigate to this screen or "pop"
    // back on this screen).
    navigation.addListener("focus", onFocus);
    return () => {
      navigation.removeListener("focus", onFocus);
    };
  }, [id, navigation, updateFolderPath]);

  if (isPending) {
    return (
      <View className="w-full flex-1 px-4">
        <LoadingIndicator />
      </View>
    );
  } else if (error) {
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
    name: `[Folder] ${fullPath?.split("/").at(-1)}`,
    // Theoretically, no tracks should be on the "root" (ie: `id = undefined`),
    // so we shouldn't see any cases where we play a track from the
    // invalid track source "id" created.
    id: `${fullPath}/`,
  } as const;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="grow pt-2"
    >
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
                  onPress={() =>
                    router.push(
                      `/folder/${id ? `${id.map((segment) => encodeURIComponent(segment)).join("/")}/` : ""}${encodeURIComponent(item.name)}`,
                    )
                  }
                  textContent={[item.name, null]}
                  Image={
                    <MaterialSymbols
                      name="folder-outline"
                      size={40}
                      className="rounded-sm bg-surface800 p-1"
                    />
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
    </ScrollView>
  );
}

function isTrackContent(data: unknown): data is Track.Content {
  return (data as Track.Content).id !== undefined;
}
