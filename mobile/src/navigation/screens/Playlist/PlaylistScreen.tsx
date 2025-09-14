import { Stack, router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import { Edit } from "~/resources/icons/Edit";
import { Favorite } from "~/resources/icons/Favorite";
import { Remove } from "~/resources/icons/Remove";
import {
  useFavoritePlaylist,
  useMoveInPlaylist,
  usePlaylistForScreen,
} from "~/queries/playlist";
import { useRemoveFromPlaylist } from "~/queries/track";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { CurrentListLayout } from "~/layouts/CurrentList";
import { areRenderItemPropsEqual } from "~/lib/react-native-draglist";

import { Colors } from "~/constants/Styles";
import { OnRTL } from "~/lib/react";
import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { FlashDragList } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
import { Swipeable, useSwipeableRef } from "~/components/Swipeable";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "~/components/Transition/Placeholder";
import { Track } from "~/modules/media/components/Track";
import type { PlayListSource } from "~/modules/media/types";

type ScreenData = Track.Content & { disc: number | null; track: number | null };
type RenderItemProps = DragListRenderItemInfo<ScreenData>;

export default function PlaylistScreen() {
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

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  // Add optimistic UI updates.
  const isToggled = favoritePlaylist.isPending
    ? !data.isFavorite
    : data.isFavorite;

  // Information about this track list.
  const trackSource = { type: "playlist", id } as const;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View className="flex-row gap-1">
              <IconButton
                Icon={Favorite}
                accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
                onPress={() => mutateGuard(favoritePlaylist, !data.isFavorite)}
                filled={isToggled}
              />
              <IconButton
                Icon={Edit}
                accessibilityLabel={t("feat.playlist.extra.edit")}
                onPress={() =>
                  router.navigate(
                    `/playlist/modify?id=${encodeURIComponent(id)}`,
                  )
                }
              />
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
          data={data.tracks}
          keyExtractor={({ id }) => id}
          renderItem={(args) => (
            <RenderItem {...args} trackSource={trackSource} />
          )}
          onReordered={onMove}
          ListEmptyComponent={
            <ContentPlaceholder errMsgKey="err.msg.noTracks" />
          }
          contentContainerClassName="pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
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
    const swipeableRef = useSwipeableRef();
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
              <Button
                accessibilityLabel={t("template.entryRemove", {
                  name: item.title,
                })}
                onPress={() => mutateGuard(removeTrack, trackSource.id)}
                className={cn("bg-red p-3", OnRTL.decide("ml-4", "mr-4"))}
              >
                <Remove color={Colors.neutral100} />
              </Button>
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
