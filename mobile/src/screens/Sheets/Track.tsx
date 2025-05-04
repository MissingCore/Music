import { router, usePathname } from "expo-router";
import type { ParseKeys } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { ActionSheetRef } from "react-native-actions-sheet";
import { SheetManager } from "react-native-actions-sheet";

import type { TrackWithAlbum } from "~/db/schema";

import { Album } from "~/icons/Album";
import { Artist } from "~/icons/Artist";
import { Favorite } from "~/icons/Favorite";
import { List } from "~/icons/List";
import { PlaylistAdd } from "~/icons/PlaylistAdd";
import { QueueMusic } from "~/icons/QueueMusic";
import { Schedule } from "~/icons/Schedule";
import { usePlaylists } from "~/queries/playlist";
import {
  useAddToPlaylist,
  useFavoriteTrack,
  useRemoveFromPlaylist,
  useTrackPlaylists,
} from "~/queries/track";
import { useSessionStore } from "~/services/SessionStore";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useTheme } from "~/hooks/useTheme";
import { Queue, useMusicStore } from "~/modules/media/services/Music";

import { Colors } from "~/constants/Styles";
import { mutateGuard } from "~/lib/react-query";
import {
  abbreviateBitRate,
  abbreviateSize,
  formatEpoch,
  formatSeconds,
} from "~/utils/number";
import { Marquee } from "~/components/Containment/Marquee";
import { SheetsFlashList } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { IconButton } from "~/components/Form/Button";
import { Checkbox } from "~/components/Form/Selection";
import { Sheet, useSheetRef } from "~/components/Sheet";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import {
  StyledText,
  TEm,
  TStyledText,
} from "~/components/Typography/StyledText";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaImage } from "~/modules/media/components/MediaImage";

//#region Track Sheet
/** Displays information about a track and enables adding it to playlists. */
export function TrackSheet() {
  const data = useSessionStore((state) => state.displayedTrack);
  const trackToPlaylistSheetRef = useSheetRef();
  return (
    <Sheet id="TrackSheet" contentContainerClassName="gap-4">
      {data !== null ? (
        <>
          <TrackIntro key={data._checked} data={data} />
          <PrimaryTrackContent
            data={data}
            showTrackToPlaylistSheet={() =>
              trackToPlaylistSheetRef.current?.show()
            }
          />
          <TrackLinks data={data} />
        </>
      ) : null}
      <TrackToPlaylistSheet
        key={data?.id}
        id={data?.id ?? ""}
        sheetRef={trackToPlaylistSheetRef}
      />
    </Sheet>
  );
}

//#region Track Introduction
/** Contains the favorite toggle. */
function TrackIntro({ data }: { data: TrackWithAlbum }) {
  const { t } = useTranslation();
  const { foreground } = useTheme();
  const favoriteTrack = useFavoriteTrack(data.id);
  const [favState, setFavState] = useState(data.isFavorite);

  return (
    <View className="flex-row gap-2">
      <Pressable
        accessibilityLabel={t(`term.${favState ? "unF" : "f"}avorite`)}
        onPress={() => {
          mutateGuard(favoriteTrack, !favState, {
            onSuccess: () => {
              setFavState((prev) => !prev);
            },
          });
        }}
        className="relative rounded active:opacity-75"
      >
        <MediaImage
          type="track"
          size={98}
          source={data.artwork}
          className="rounded"
        />
        <View className="absolute right-1 top-1 rounded-full bg-neutral0/75 p-1">
          <Favorite size={16} color={Colors.neutral100} filled={favState} />
        </View>
      </Pressable>

      <View className="shrink self-end">
        {data.artistName ? (
          <Marquee>
            <StyledText dim>{data.artistName}</StyledText>
          </Marquee>
        ) : null}
        <Marquee>
          <StyledText>{data.name}</StyledText>
        </Marquee>
        {data.album ? (
          <Marquee>
            <StyledText dim className="text-xxs">
              {data.album.name}
            </StyledText>
          </Marquee>
        ) : null}
        <Marquee wrapperClassName="mt-2">
          <View className="flex-row items-center">
            <Schedule size={12} color={`${foreground}80`} />
            <StyledText dim className="text-xxs">
              {` ${formatSeconds(data.duration)}`}
              {data.format ? ` | ${data.format}` : undefined}
            </StyledText>
          </View>
        </Marquee>
      </View>
    </View>
  );
}
//#endregion

//#region Primary Content
/** Track information and add actions. */
function PrimaryTrackContent({
  data,
  showTrackToPlaylistSheet,
}: {
  data: TrackWithAlbum;
  /**
   * FIXME: Temporary prop.
   * @deprecated
   */
  showTrackToPlaylistSheet: () => void;
}) {
  return (
    <>
      <Divider />
      {/* Stats */}
      <View className="gap-2">
        <View className="flex-row gap-2">
          <StatItem
            titleKey="feat.modalTrack.extra.bitrate"
            description={
              data.bitrate !== null ? abbreviateBitRate(data.bitrate) : "—"
            }
          />
          <StatItem
            titleKey="feat.modalTrack.extra.sampleRate"
            description={
              data.sampleRate !== null ? `${data.sampleRate} Hz` : "—"
            }
          />
        </View>
        <View className="flex-row gap-2">
          <StatItem
            titleKey="feat.modalTrack.extra.size"
            description={abbreviateSize(data.size)}
          />
          <StatItem
            titleKey="feat.modalSort.extra.modified"
            description={formatEpoch(data.modificationTime)}
          />
        </View>
        <View className="flex-row">
          <StatItem
            titleKey="feat.modalTrack.extra.filePath"
            description={data.uri}
          />
        </View>
      </View>
      <Divider />
      {/* Add Actions */}
      <View className="flex-row gap-2">
        <SheetButton
          onPress={showTrackToPlaylistSheet}
          Icon={<PlaylistAdd />}
          textKey="feat.modalTrack.extra.addToPlaylist"
          preventClose
        />
        <SheetButton
          onPress={() => Queue.add({ id: data.id, name: data.name })}
          Icon={<QueueMusic />}
          textKey="feat.modalTrack.extra.addToQueue"
        />
      </View>
    </>
  );
}
//#endregion

//#region Track Links
function TrackLinks({ data }: { data: TrackWithAlbum }) {
  const pathname = usePathname();
  const playingSource = useMusicStore((state) => state.playingSource);
  const playingList = useMusicStore((state) => state.playingList);

  const canShowPlaylistBtn =
    pathname === "/now-playing" && playingSource?.type === "playlist";
  const isInList = playingList.some((id) => id === data.id);

  // Don't render the last `<Divider />` if there's no content in this row.
  if (!data.artistName && !data.album && (!canShowPlaylistBtn || !isInList)) {
    return null;
  }

  return (
    <>
      <Divider />
      <View className="flex-row flex-wrap gap-2">
        {data.artistName ? (
          <SheetButton
            onPress={() => router.navigate(`/artist/${data.artistName}`)}
            Icon={<Artist />}
            textKey="term.artist"
          />
        ) : null}
        {data.album ? (
          <SheetButton
            onPress={() => router.navigate(`/album/${data.album?.id}`)}
            Icon={<Album />}
            textKey="term.album"
          />
        ) : null}
        {canShowPlaylistBtn && isInList ? (
          <SheetButton
            onPress={() =>
              router.navigate(
                playingSource?.id === ReservedPlaylists.tracks
                  ? "/track"
                  : `/playlist/${encodeURIComponent(playingSource?.id ?? "")}`,
              )
            }
            Icon={<List />}
            textKey="term.playlist"
          />
        ) : null}
      </View>
    </>
  );
}
//#endregion

//#region Stat Item
/** Represents a statistical piece of information about the file. */
function StatItem(props: { titleKey: ParseKeys; description: string }) {
  return (
    <View className="flex-1">
      <Marquee>
        <TEm dim textKey={props.titleKey} />
      </Marquee>
      <Marquee>
        <StyledText className="text-xs">{props.description}</StyledText>
      </Marquee>
    </View>
  );
}
//#endregion

//#region Sheet Button
/** Clicking this button will also close the model */
function SheetButton(props: {
  onPress: () => void;
  Icon: React.JSX.Element;
  textKey: ParseKeys;
  preventClose?: boolean;
}) {
  const { width } = useGetColumn({ cols: 2, gap: 8, gutters: 32 });
  return (
    <IconButton
      kind="extended"
      onPress={() => {
        if (!props.preventClose) SheetManager.hide("TrackSheet");
        props.onPress();
      }}
      style={{ width }}
      className="p-2"
    >
      {props.Icon}
      <TStyledText textKey={props.textKey} className="shrink text-xs" />
    </IconButton>
  );
}
//#endregion
//#endregion

//#region Track To Playlist Sheet
/** Enables us to select which playlists the track belongs to. */
function TrackToPlaylistSheet({
  id,
  sheetRef,
}: {
  id: string;
  /**
   * FIXME: Temporary prop.
   * @deprecated
   */
  sheetRef: React.RefObject<ActionSheetRef>;
}) {
  const { canvasAlt, surface } = useTheme();
  const { data } = usePlaylists();
  const { data: inList } = useTrackPlaylists(id);
  const addToPlaylist = useAddToPlaylist(id);
  const removeFromPlaylist = useRemoveFromPlaylist(id);

  return (
    <Sheet
      // id="TrackToPlaylistSheet"
      ref={sheetRef}
      titleKey="feat.modalTrack.extra.addToPlaylist"
      // Hide the Track sheet when we close this sheet since it's still open.
      onBeforeClose={() => SheetManager.hide("TrackSheet")}
      snapTop
    >
      <SheetsFlashList
        estimatedItemSize={58} // 54px Height + 4px Margin Top
        data={data}
        keyExtractor={({ name }) => name}
        renderItem={({ item, index }) => {
          const selected = inList?.includes(item.name) ?? false;
          return (
            <Checkbox
              selected={selected}
              onSelect={() =>
                mutateGuard(
                  // @ts-expect-error - We don't care about return type.
                  selected ? removeFromPlaylist : addToPlaylist,
                  item.name,
                )
              }
              wrapperClassName={index > 0 ? "mt-1" : undefined}
            >
              <Marquee color={selected ? surface : canvasAlt}>
                <StyledText>{item.name}</StyledText>
              </Marquee>
            </Checkbox>
          );
        }}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noPlaylists" />
        }
        contentContainerClassName="pb-4"
      />
    </Sheet>
  );
}

//#endregion
