import { useMemo } from "react";

import { Image } from "~/resources/icons/Image";
import { LowPriority } from "~/resources/icons/LowPriority";
import { QueueMusic } from "~/resources/icons/QueueMusic";
import { Queue } from "~/stores/Playback/actions";
import {
  AlbumArtworkSheet,
  ArtistArtworkSheet,
  PlaylistArtworkSheet,
} from "../screens/ArtworkSheet";

import type { MenuAction } from "~/components/Menu";
import { Menu } from "~/components/Menu";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { ReservedPlaylists } from "~/modules/media/constants";

/** Icon button that opens a menu with some pre-defined options. */
export function CurrentListMenu(props: {
  id: string;
  type: "album" | "artist" | "playlist";
  name: string;
  trackIds: string[];
  actions?: MenuAction[];
}) {
  const artworkSheetRef = useSheetRef();

  const isFavoritesPlaylist = useMemo(
    () => props.type === "playlist" && props.id === ReservedPlaylists.favorites,
    [props.id, props.type],
  );

  const queueActions = useMemo<MenuAction[]>(
    () => [
      {
        Icon: QueueMusic,
        labelKey: "feat.queue.extra.playNext",
        onPress: () => Queue.add({ id: props.trackIds, name: props.name }),
      },
      {
        Icon: LowPriority,
        labelKey: "feat.queue.extra.playLast",
        onPress: () => Queue.addToEnd({ id: props.trackIds, name: props.name }),
      },
    ],
    [props.name, props.trackIds],
  );

  const menuActions = useMemo(() => {
    const actions: MenuAction[] = [];

    if (!isFavoritesPlaylist) {
      actions.push({
        Icon: Image,
        labelKey: "feat.artwork.extra.change",
        onPress: () => artworkSheetRef.current?.present(),
      });
    }

    return actions.concat(props.actions ?? []).concat(queueActions);
  }, [props.actions, queueActions, artworkSheetRef, isFavoritesPlaylist]);

  const RenderedSheet = useMemo(() => {
    if (props.type === "album") return AlbumArtworkSheet;
    else if (props.type === "artist") return ArtistArtworkSheet;
    return PlaylistArtworkSheet;
  }, [props.type]);

  return (
    <>
      <Menu actions={menuActions} />
      {!isFavoritesPlaylist ? (
        <RenderedSheet sheetRef={artworkSheetRef} id={props.id} />
      ) : null}
    </>
  );
}
