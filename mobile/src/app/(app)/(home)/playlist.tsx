import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { cssInterop } from "nativewind";
import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Ionicons } from "@/resources/icons";
import { usePlaylistsForMediaCard } from "@/api/playlists";
import { useGetColumn } from "@/hooks/useGetColumn";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { Colors } from "@/constants/Styles";
import { MediaCard, PlaceholderContent } from "@/components/media/card";
import { StyledPressable } from "@/components/ui/pressable";

const WrappedSvg = cssInterop(Svg, { className: "style" });

/** Screen for `/playlist` route. */
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

/** Opens up a modal to create a new playlist. */
function CreatePlaylistButton({ colWidth }: { colWidth: number }) {
  const openModal = useSetAtom(mediaModalAtom);

  return (
    <View
      style={{ width: colWidth, height: colWidth }}
      className="overflow-hidden rounded-lg"
    >
      <StyledPressable
        onPress={() => openModal({ entity: "playlist", scope: "new" })}
        className="flex-1 items-center justify-center"
      >
        {/* Custom dashed border with longer dashes & spacing. Has a 16px radius. */}
        <WrappedSvg
          width={colWidth}
          height={colWidth}
          viewBox="0 0 201 202"
          preserveAspectRatio="none"
          className="absolute left-0 top-0 size-full"
        >
          <Path
            d="M184.5 1H16.5C7.66344 1 0.5 8.16344 0.5 17V185C0.5 193.837 7.66344 201 16.5 201H184.5C193.337 201 200.5 193.837 200.5 185V17C200.5 8.16344 193.337 1 184.5 1Z"
            vectorEffect="non-scaling-stroke"
            fill="none"
            stroke={Colors.foreground50}
            strokeDasharray={[10, 10]}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </WrappedSvg>
        <Ionicons name="add-outline" size={36} />
      </StyledPressable>
    </View>
  );
}
