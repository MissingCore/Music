import { Stack, router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist";
import DragList from "react-native-draglist";

import { Edit, Favorite, Remove } from "@/icons";
import {
  useFavoritePlaylist,
  useMoveInPlaylist,
  usePlaylistForScreen,
} from "@/queries/playlist";
import { useRemoveFromPlaylist } from "@/queries/track";
import { useBottomActionsContext } from "@/hooks/useBottomActionsContext";
import { CurrentListLayout } from "@/layouts/CurrentList";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { pickKeys } from "@/utils/object";
import { useListPresets } from "@/components/Defaults";
import { IconButton } from "@/components/Form";
import type { SwipeableRef } from "@/components/Swipeable";
import { Swipeable } from "@/components/Swipeable";
import { PagePlaceholder } from "@/components/Transition";
import { Track } from "@/modules/media/components";
import type { PlayListSource } from "@/modules/media/types";

type ScreenData = Track.Content & { disc: number | null; track: number | null };

type RenderItemProps = DragListRenderItemInfo<ScreenData>;

/** Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const listPresets = useListPresets({ emptyMsgKey: "response.noTracks" });
  const { id } = useLocalSearchParams<{ id: string }>();
  const [playlistTracks, setPlaylistTracks] = useState<ScreenData[]>([]);
  const { isPending, error, data } = usePlaylistForScreen(id);
  const favoritePlaylist = useFavoritePlaylist(id);
  const moveInPlaylist = useMoveInPlaylist(id);

  // Information about this track list.
  const trackSource = useMemo(() => ({ type: "playlist", id }) as const, [id]);

  const renderItem = useCallback(
    (args: RenderItemProps) => <RenderItem {...{ ...args, trackSource }} />,
    [trackSource],
  );

  const onReordered = useCallback(
    async (fromIndex: number, toIndex: number) => {
      setPlaylistTracks((prev) => {
        const copy = [...prev];
        const moved = copy.splice(fromIndex, 1);
        return copy.toSpliced(toIndex, 0, moved[0]!);
      });
      mutateGuard(moveInPlaylist, { fromIndex, toIndex });
    },
    [moveInPlaylist],
  );

  // Ensure that after the mutation completes, we synchronize the optimized state.
  useEffect(() => {
    if (data && Array.isArray(data.tracks)) setPlaylistTracks(data.tracks);
  }, [data]);

  if (isPending || error) return <PagePlaceholder {...{ isPending }} />;

  // Add optimistic UI updates.
  const isToggled = favoritePlaylist.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View className="flex-row gap-1">
              <IconButton
                kind="ripple"
                accessibilityLabel={t(
                  `common.${isToggled ? "unF" : "f"}avorite`,
                )}
                onPress={() => mutateGuard(favoritePlaylist, !data.isFavorite)}
              >
                <Favorite filled={isToggled} />
              </IconButton>
              <IconButton
                kind="ripple"
                accessibilityLabel={t("playlist.edit")}
                onPress={() =>
                  router.navigate(
                    `/playlist/modify?id=${encodeURIComponent(id)}`,
                  )
                }
              >
                <Edit />
              </IconButton>
            </View>
          ),
        }}
      />
      <CurrentListLayout
        title={data.name}
        metadata={data.metadata}
        imageSource={data.imageSource}
        mediaSource={trackSource}
      >
        <DragList
          estimatedItemSize={56} // 48px Height + 8px Margin Top
          data={playlistTracks}
          keyExtractor={({ id }) => id}
          renderItem={renderItem}
          onReordered={onReordered}
          {...listPresets}
          contentContainerClassName="pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
        />
      </CurrentListLayout>
    </>
  );
}

/** Item rendered in the `<DragList />`. */
const RenderItem = memo(function RenderItem({
  item,
  trackSource,
  ...info
}: RenderItemProps & { trackSource: PlayListSource }) {
  const { t } = useTranslation();
  const swipeableRef = useRef<SwipeableRef>(null);
  const [lastItemId, setLastItemId] = useState(item.id);
  const removeTrack = useRemoveFromPlaylist(item.id);

  if (item.id !== lastItemId) {
    setLastItemId(item.id);
    if (swipeableRef.current) swipeableRef.current.resetIfNeeded();
  }

  return (
    <Pressable
      delayLongPress={150}
      onLongPress={info.onDragStart}
      onPressOut={info.onDragEnd}
      className={cn("group", { "mt-2": info.index > 0 })}
    >
      <Swipeable
        // @ts-expect-error - Error assigning ref to class component.
        ref={swipeableRef}
        enabled={!info.isDragging}
        renderRightActions={() =>
          info.isActive ? undefined : (
            <IconButton
              accessibilityLabel={t("template.entryRemove", {
                name: item.title,
              })}
              onPress={() => mutateGuard(removeTrack, trackSource.id)}
              className="mr-4 bg-red"
            >
              <Remove color={Colors.neutral100} />
            </IconButton>
          )
        }
      >
        <Track
          delayLongPress={150}
          onLongPress={info.onDragStart}
          onPressOut={info.onDragEnd}
          disabled={info.isDragging}
          {...item}
          trackSource={trackSource}
          className={cn("mx-4 group-active:bg-surface/50", {
            "!bg-surface": info.isActive,
          })}
        />
      </Swipeable>
    </Pressable>
  );
}, areRenderItemPropsEqual);

const RenderItemPrimitiveProps = ["index", "isActive", "isDragging"] as const;

function areRenderItemPropsEqual(
  oldProps: RenderItemProps,
  newProps: RenderItemProps,
) {
  const primitiveProps = pickKeys(oldProps, RenderItemPrimitiveProps);
  return (
    oldProps.item.id === newProps.item.id &&
    Object.entries(primitiveProps).every(
      // @ts-expect-error - Non-existent type conflicts.
      ([key, value]) => value === newProps[key],
    )
  );
}
