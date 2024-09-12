import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { View } from "react-native";

import { useToggleFavorite } from "@/api/favorites/[id]";
import { useTrackExcerpt } from "@/api/tracks/[id]";
import { Queue, playListSourceAtom } from "@/modules/media/services/Persistent";
import { mediaModalAtom } from "./store";

import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { ScrollRow } from "@/components/ui/container";
import { Heading } from "@/components/ui/text";
import { ReservedPlaylists } from "@/modules/media/constants/ReservedNames";
import type { MediaList } from "@/modules/media/types";
import { ModalBase } from "../../components/base";
import { Button } from "../../components/button";

type Props = { id: string; origin?: MediaList | "current" };

/** Modal used for tracks. */
export function TrackModal({ id, origin }: Props) {
  const openModal = useSetAtom(mediaModalAtom);
  const { isPending, error, data } = useTrackExcerpt(id);
  const toggleFavoriteFn = useToggleFavorite({ type: "track", id });

  if (isPending || error) return null;

  // Add optimistic UI updates.
  const isToggled = toggleFavoriteFn.isPending
    ? !data.isFavorite
    : data.isFavorite;

  const hasSecondRow =
    (origin !== "album" && !!data.album) ||
    (origin !== "artist" && !!data.artistName) ||
    origin === "current";

  return (
    <ModalBase detached>
      <BottomSheetScrollView>
        <Heading as="h3" asLine className="px-4">
          {data.name}
        </Heading>
        <Heading
          as="h5"
          asLine
          className={cn("mb-6 px-4 text-accent50", {
            "mb-4":
              (origin === "artist" && !data.album?.name) ||
              (origin !== "artist" && !data.artistName),
          })}
        >
          {origin === "artist" ? data.album?.name : data.artistName}
        </Heading>

        <ScrollRow>
          <Button
            content={isToggled ? "Unfavorite" : "Favorite"}
            icon={isToggled ? "favorite" : "favorite-outline"}
            onPress={() => mutateGuard(toggleFavoriteFn, undefined)}
            dontCloseOnPress
          />
          <Button
            content="Add to Playlists"
            icon="playlist-add-outline"
            onPress={() =>
              openModal({ entity: "track", scope: "playlist", id })
            }
          />
          <Button
            content="Add to Queue"
            icon="queue-music-outline"
            onPress={() => Queue.add(data.id)}
          />
        </ScrollRow>

        {hasSecondRow && (
          <View className="mx-2 my-4 h-[1px] flex-1 bg-surface500" />
        )}

        <ScrollRow>
          {origin !== "album" && !!data.album && (
            <Button
              interaction="link"
              href={`/album/${data.album.id}`}
              content="View Album"
              icon="album-outline"
            />
          )}

          {origin !== "artist" && !!data.artistName && (
            <Button
              interaction="link"
              href={`/artist/${encodeURIComponent(data.artistName)}`}
              content="View Artist"
              icon="artist-outline"
            />
          )}

          {origin === "current" && (
            <>
              <ViewPlaylist />
              <Button
                content="View Upcoming"
                icon="library-music"
                onPress={() =>
                  openModal({ entity: "track", scope: "upcoming" })
                }
              />
            </>
          )}
        </ScrollRow>
      </BottomSheetScrollView>
    </ModalBase>
  );
}

/** Renders a button to view the current playing playlist. */
function ViewPlaylist() {
  const source = useAtomValue(playListSourceAtom);

  const currentPlaylist = useMemo(() => {
    return source?.type === "playlist" ? source.id : undefined;
  }, [source]);

  if (!currentPlaylist) return null;

  return (
    <Button
      interaction="link"
      href={
        currentPlaylist === ReservedPlaylists.tracks
          ? "/track"
          : `/playlist/${encodeURIComponent(currentPlaylist)}`
      }
      content="View Playlist"
      icon="list-outline"
    />
  );
}
