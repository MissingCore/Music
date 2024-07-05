import Ionicons from "@expo/vector-icons/Ionicons";
import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { View } from "react-native";

import { DashedBorder } from "@/assets/svgs/DashedBorder";
import { usePlaylistsForMediaCard } from "@/api/playlists";
import { useGetColumn } from "@/hooks/layout";
import { modalAtom } from "@/features/modal/store";

import { Colors } from "@/constants/Styles";
import { MediaCard, PlaceholderContent } from "@/components/media/card";
import { StyledPressable } from "@/components/ui/pressable";

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
    <View
      style={{ width: colWidth, height: colWidth }}
      className="overflow-hidden rounded-lg"
    >
      <StyledPressable
        onPress={() => openModal({ entity: "playlist", scope: "new" })}
        className="flex-1 items-center justify-center"
      >
        <DashedBorder size={colWidth} />
        <View className="pointer-events-none">
          <Ionicons name="add-outline" size={36} color={Colors.foreground50} />
        </View>
      </StyledPressable>
    </View>
  );
}
