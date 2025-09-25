import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import { Favorite } from "~/resources/icons/Favorite";
import { Remove } from "~/resources/icons/Remove";
import {
  useFavoritePlaylist,
  useMoveInPlaylist,
  usePlaylistForScreen,
} from "~/queries/playlist";
import { useRemoveFromPlaylist } from "~/queries/track";
import { useBottomActionsInset } from "../../../hooks/useBottomActions";
import { CurrentListLayout } from "../../../layouts/CurrentList";
import { ExportM3USheet } from "./ExportM3USheet";
import { PlaylistArtworkSheet } from "../../ArtworkSheet";

import { Colors } from "~/constants/Styles";
import { OnRTL } from "~/lib/react";
import { areRenderItemPropsEqual } from "~/lib/react-native-draglist";
import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { FlashDragList } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
import type { MenuAction } from "~/components/Menu";
import { Menu } from "~/components/Menu";
import { useSheetRef } from "~/components/Sheet";
import { Swipeable, useSwipeableRef } from "~/components/Swipeable";
import {
  Track,
  useTrackListPlayingIndication,
} from "~/modules/media/components/Track";
import type { PlayListSource } from "~/modules/media/types";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "../../../components/Placeholder";
import { ScreenOptions } from "../../../components/ScreenOptions";

type Props = StaticScreenProps<{ id: string }>;

type ScreenData = Track.Content & { disc: number | null; track: number | null };
type RenderItemProps = DragListRenderItemInfo<
  ScreenData & { showIndicator?: boolean }
>;

export default function Playlist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const bottomInset = useBottomActionsInset();
  const { isPending, error, data } = usePlaylistForScreen(id);
  const moveInPlaylist = useMoveInPlaylist(id);
  const favoritePlaylist = useFavoritePlaylist(id);

  const onMove = useCallback(
    (fromIndex: number, toIndex: number) =>
      mutateGuard(moveInPlaylist, { fromIndex, toIndex }),
    [moveInPlaylist],
  );

  const trackSource = { type: "playlist", id } as const;
  const listData = useTrackListPlayingIndication(trackSource, data?.tracks);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  // Add optimistic UI updates.
  const isToggled = favoritePlaylist.isPending
    ? !data.isFavorite
    : data.isFavorite;

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <View className="flex-row gap-1">
            <IconButton
              Icon={Favorite}
              accessibilityLabel={t(`term.${isToggled ? "unF" : "f"}avorite`)}
              onPress={() => mutateGuard(favoritePlaylist, !data.isFavorite)}
              filled={isToggled}
            />
            <AdditionalActions id={id} />
          </View>
        )}
      />
      <CurrentListLayout
        title={data.name}
        metadata={data.metadata}
        imageSource={data.imageSource}
        mediaSource={trackSource}
      >
        <FlashDragList
          estimatedItemSize={56} // 48px Height + 8px Margin Top
          data={listData!}
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
        delayLongPress={250}
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
            delayLongPress={250}
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
  areRenderItemPropsEqual(
    (o, n) =>
      o.item.id === n.item.id && o.item.showIndicator === n.item.showIndicator,
  ),
);

function AdditionalActions({ id }: { id: string }) {
  const navigation = useNavigation();
  const artworkSheetRef = useSheetRef();
  const exportSheetRef = useSheetRef();

  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        labelKey: "feat.artwork.extra.change",
        onPress: () => artworkSheetRef.current?.present(),
      },
      {
        labelKey: "feat.playlist.extra.edit",
        onPress: () => navigation.navigate("ModifyPlaylist", { id }),
      },
      {
        labelKey: "feat.playlist.extra.m3uExport",
        onPress: () => exportSheetRef.current?.present(),
      },
    ],
    [navigation, id, artworkSheetRef, exportSheetRef],
  );

  return (
    <>
      <Menu actions={menuActions} />
      <PlaylistArtworkSheet sheetRef={artworkSheetRef} id={id} />
      <ExportM3USheet sheetRef={exportSheetRef} id={id} />
    </>
  );
}
