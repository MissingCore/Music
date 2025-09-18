import { createNavigationContainerRef } from "@react-navigation/native";

import type { PlayListSource } from "~/modules/media/types";
import { ReservedPlaylists } from "~/modules/media/constants";
import type { MediaCard } from "~/modules/media/components/MediaCard";

export const navigationRef = createNavigationContainerRef();

export const router = {
  back: () => {},
  navigate: (href: string) => {},
  push: (href: string) => {},
  replace: (href: string) => {},
};

/** Get arguments for `useNavigation` navigation functions. */
export function getMediaLinkContext({
  id,
  type,
}: PlayListSource | MediaCard.Content) {
  if (type === "album") return ["Album", { id }] as const;
  else if (type === "artist") return ["Artist", { id }] as const;
  else if (type === "folder") {
    return [
      "HomeScreens",
      { screen: "Folders", params: { path: id } },
    ] as const;
  } else if (type === "playlist") {
    if (id === ReservedPlaylists.favorites) return ["FavoriteTracks"] as const;
    else if (id === ReservedPlaylists.tracks) {
      return ["HomeScreens", { screen: "Tracks" }] as const;
    }
    return ["Playlist", { id }] as const;
  }
  throw new Error("`MediaCard` linking doesn't support `track`.");
}
