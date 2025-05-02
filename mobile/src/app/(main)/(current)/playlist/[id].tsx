import { Stack, router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import { Edit } from "~/icons/Edit";
import { Favorite } from "~/icons/Favorite";
import { Remove } from "~/icons/Remove";
import {
  useFavoritePlaylist,
  useMoveInPlaylist,
  usePlaylistForScreen,
} from "~/queries/playlist";
import { useRemoveFromPlaylist } from "~/queries/track";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { CurrentListLayout } from "~/layouts/CurrentList";
import {
  areRenderItemPropsEqual,
  useDragListState,
} from "~/lib/react-native-draglist";

import { Colors } from "~/constants/Styles";
import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { FlashDragList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import type { SwipeableRef } from "~/components/Swipeable";
import { Swipeable } from "~/components/Swipeable";
import { PagePlaceholder } from "~/components/Transition/Placeholder";
import { Track } from "~/modules/media/components/Track";
import type { PlayListSource } from "~/modules/media/types";

type ScreenData = Track.Content & { disc: number | null; track: number | null };
type RenderItemProps = DragListRenderItemInfo<ScreenData>;

/** Screen for `/playlist/[id]` route. */
export default function CurrentPlaylistScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = usePlaylistForScreen(id);
  const moveInPlaylist = useMoveInPlaylist(id);
  const favoritePlaylist = useFavoritePlaylist(id);

  const onMove = useCallback(
    (fromIndex: number, toIndex: number) =>
      mutateGuard(moveInPlaylist, { fromIndex, toIndex }),
    [moveInPlaylist],
  );

  const { items, onReordered } = useDragListState({
    data: data?.tracks,
    onMove,
  });

  // Information about this track list.
  const trackSource = useMemo(() => ({ type: "playlist", id }) as const, [id]);

  const renderItem = useCallback(
    (args: RenderItemProps) => <RenderItem {...{ ...args, trackSource }} />,
    [trackSource],
  );

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

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
                accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
                onPress={() => mutateGuard(favoritePlaylist, !data.isFavorite)}
              >
                <Favorite filled={isToggled} />
              </IconButton>
              <IconButton
                kind="ripple"
                accessibilityLabel={t("feat.playlist.extra.edit")}
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
        <FlashDragList
          estimatedItemSize={56} // 48px Height + 8px Margin Top
          data={items}
          keyExtractor={({ id }) => id}
          renderItem={renderItem}
          onReordered={onReordered}
          contentContainerClassName="pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
          emptyMsgKey="err.msg.noTracks"
        />
      </CurrentListLayout>
    </>
  );
}

/** Item rendered in the `<DragList />`. */
const RenderItem = memo(
  function RenderItem({
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
        delayLongPress={100}
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
            delayLongPress={100}
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
  },
  areRenderItemPropsEqual((o, n) => o.item.id === n.item.id),
);
