import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { usePathname } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { View } from "react-native";

import { useToggleFavorite } from "@/api/favorites/[id]";
import { useTrackExcerpt } from "@/api/tracks/[id]";
import {
  useDeleteTrackFromPlaylist,
  useIsTrackInPlaylist,
} from "@/api/tracks/[id]/playlist";
import { queuePushAtom } from "@/features/playback/api/queue";
import { trackListAtom } from "@/features/playback/api/track";
import { modalAtom } from "../store";

import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import type { MediaList } from "@/components/media/types";
import { ReservedNames, SpecialPlaylists } from "@/features/playback/constants";
import { ModalBase } from "../components/ModalBase";
import { Button, Link } from "../components/ModalInteractive";
import { ScrollRow, Subtitle, Title } from "../components/ModalUI";

type Props = { trackId: string; origin?: MediaList | "track-current" };

/** @description Modal used for tracks. */
export function TrackModal({ trackId, origin }: Props) {
  const openModal = useSetAtom(modalAtom);
  const addTrackToQueue = useSetAtom(queuePushAtom);
  const { isPending, error, data } = useTrackExcerpt(trackId);
  const toggleFavoriteFn = useToggleFavorite({ type: "track", id: trackId });

  if (isPending || error) return null;

  // Add optimistic UI updates.
  const isToggled = toggleFavoriteFn.isPending
    ? !data.isFavorite
    : data.isFavorite;

  const hasSecondRow =
    (!!data.album && origin !== "album") || origin !== "artist";

  return (
    <ModalBase detached>
      <BottomSheetScrollView>
        <Title asLine className="px-4">
          {data.name}
        </Title>
        <Subtitle
          asLine
          className={cn("mb-8 px-4", {
            "mb-4": origin === "artist" && !data.album?.name,
          })}
        >
          {origin === "artist" ? data.album?.name : data.artistName}
        </Subtitle>

        <ScrollRow>
          <Button
            content={isToggled ? "Unfavorite" : "Favorite"}
            icon={isToggled ? "FavoriteFilled" : "FavoriteOutline"}
            onPress={() => mutateGuard(toggleFavoriteFn, undefined)}
            dontCloseOnPress
          />
          <RemoveTrackFromPlaylist trackId={trackId} />
          <Button
            content="Add to Playlists"
            icon="PlaylistAddOutline"
            onPress={() =>
              openModal({ type: "track-to-playlist", id: trackId })
            }
          />
          <Button
            content="Add to Queue"
            icon="QueueMusicOutline"
            onPress={() => addTrackToQueue(data.id)}
          />
        </ScrollRow>

        {hasSecondRow && (
          <View className="mx-2 my-4 h-[1px] flex-1 bg-surface500" />
        )}

        <ScrollRow>
          {!!data.album && origin !== "album" && (
            <Link
              href={`/album/${data.album.id}`}
              content="View Album"
              icon="AlbumOutline"
            />
          )}

          {origin !== "artist" && (
            <Link
              href={`/artist/${data.artistName}`}
              content="View Artist"
              icon="ArtistOutline"
            />
          )}

          {origin === "track-current" && (
            <>
              <ViewPlaylist />
              <Button
                content="View Upcoming"
                icon="LibraryMusicFilled"
                onPress={() => openModal({ type: "track-upcoming" })}
              />
            </>
          )}
        </ScrollRow>
      </BottomSheetScrollView>
    </ModalBase>
  );
}

/**
 * @description Renders a button to remove track from this playlist if
 *  certain conditions are met.
 */
function RemoveTrackFromPlaylist({ trackId }: { trackId: string }) {
  const pathname = usePathname();
  const { reference } = useAtomValue(trackListAtom);

  const isValidPath = useMemo(
    () => pathname.startsWith("/playlist/") || pathname === "/current-track",
    [pathname],
  );
  const currentPlaylist = useMemo(() => {
    let _playlistName = pathname.startsWith("/playlist/")
      ? decodeURIComponent(pathname.substring(10))
      : reference?.type === "playlist"
        ? reference.name
        : undefined;
    if (_playlistName && ReservedNames.has(_playlistName)) {
      _playlistName = undefined;
    }

    return _playlistName;
  }, [pathname, reference]);

  const {
    isPending,
    error,
    data: isTrackInPlaylist,
  } = useIsTrackInPlaylist(trackId, currentPlaylist ?? "");
  const removeTrackFromPlaylist = useDeleteTrackFromPlaylist(
    trackId,
    currentPlaylist ?? "",
  );

  if (isPending || error) return null;
  if (!isValidPath || !isTrackInPlaylist) return null;

  return (
    <Button
      content="Remove from this Playlist"
      icon="DeleteOutline"
      onPress={() => mutateGuard(removeTrackFromPlaylist, undefined)}
    />
  );
}

/** @description Renders a button to view the current playing playlist. */
function ViewPlaylist() {
  const { reference } = useAtomValue(trackListAtom);

  const currentPlaylist = useMemo(() => {
    return reference?.type === "playlist" ? reference.name : undefined;
  }, [reference]);

  if (!currentPlaylist) return null;

  return (
    <Link
      href={
        currentPlaylist === SpecialPlaylists.tracks
          ? "/track"
          : `/playlist/${currentPlaylist}`
      }
      content="View Playlist"
      icon="ListOutline"
    />
  );
}
