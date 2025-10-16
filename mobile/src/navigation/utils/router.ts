import { createNavigationContainerRef } from "@react-navigation/native";

import type { PlayListSource } from "~/modules/media/types";
import { ReservedPlaylists } from "~/modules/media/constants";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";

export const navigationRef = createNavigationContainerRef();

/** Ability to navigate outside of React context. **Use as little as possible.** */
export const router = {
  back: () => {
    if (navigationRef.isReady()) navigationRef.goBack();
  },
  navigate: (...args: any[]) => {
    // @ts-expect-error - Arguments should be compatible.
    if (navigationRef.isReady()) navigationRef.navigate(...args);
  },
};

/** Get arguments for `useNavigation` navigation functions. */
export function getMediaLinkContext({
  id,
  type,
}: PlayListSource | MediaCardContent) {
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
  throw new Error(`Can't parse route with arguments: ${type} ${id}`);
}
