import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { Pressable, View } from "react-native";

import { DashedBorder } from "@/assets/svgs/DashedBorder";
import { usePlaylistsForMediaCard } from "@/api/playlists";
import { useGetColumn } from "@/hooks/layout";
import { modalAtom } from "@/features/modal/store";

import { Colors } from "@/constants/Styles";
import { MediaCard, PlaceholderContent } from "@/components/media/card";

/** @description Screen for `/playlist` route. */
export default function PlaylistScreen() {
  const { data } = usePlaylistsForMediaCard();
  const columnParams = useMemo(
    () => ({ cols: 2, gap: 16, gutters: 32, minWidth: 175 }),
    [],
  );
  const { count, width } = useGetColumn(columnParams);

  return (
    <View className="-m-2 mt-0 flex-1 px-4">
      <FlashList
        numColumns={count}
        estimatedItemSize={width + 37} // 35px `<TextStack />` Height + 2px Margin Top
        data={data ? [PlaceholderContent, ...data] : [PlaceholderContent]}
        keyExtractor={({ href }) => href}
        renderItem={({ item: data, index }) => (
          <View className="mx-2 mb-4">
            {index === 0 ? (
              <CreatePlaylistButton colWidth={width} />
            ) : (
              <MediaCard {...data} size={width} />
            )}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 22 }}
      />
    </View>
  );
}

/** @description Opens up a modal to create a new playlist. */
function CreatePlaylistButton({ colWidth }: { colWidth: number }) {
  const openModal = useSetAtom(modalAtom);

  return (
    <Pressable
      onPress={() => openModal({ entity: "playlist", scope: "new" })}
      style={{ width: colWidth, height: colWidth }}
      className="items-center justify-center rounded-lg active:bg-surface800"
    >
      <DashedBorder size={colWidth} />
      <Ionicons name="add-outline" size={36} color={Colors.foreground100} />
    </Pressable>
  );
}
