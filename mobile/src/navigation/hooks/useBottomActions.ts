import type { NavigationRoute, ParamListBase } from "@react-navigation/native";
import { useNavigationState } from "@react-navigation/native";
import { useMemo } from "react";

import { usePlaybackStore } from "~/stores/Playback/store";

/** Non-home screen routes where the miniplayer is visible. */
const miniPlayerRoutes = [
  "RecentlyPlayed-",
  "Album-",
  "Artist-",
  "Genre-",
  "Playlist-",
];

function showMiniPlayerOnRoute(
  routes: Array<NavigationRoute<ParamListBase, string>>,
) {
  return miniPlayerRoutes.some((key) => routes.at(-1)?.key.startsWith(key));
}

/** Determines if we should render the navbar and/or miniplayer. */
export function useRenderBottomActions() {
  // Wanted structure of `availableRoutes` should be:
  //  - [{ key: "HomeScreens-*"}, { key: miniPlayerVisibleRoutes[number] }]
  const availableRoutes = useNavigationState((s) => s.routes);
  const activeTrack = usePlaybackStore((s) => s.activeTrack);

  const canRenderMiniPlayer = !!activeTrack;
  const isMiniPlayerShown = showMiniPlayerOnRoute(availableRoutes);
  // Show navbar when displaying `HomeScreens` navigator. This is only
  // true when the returned routes only contain this entry.
  const onHomeScreen = availableRoutes.at(-1)?.key.startsWith("HomeScreens-");

  return useMemo(
    () => ({
      miniPlayer: canRenderMiniPlayer && (onHomeScreen || isMiniPlayerShown),
      navBar: onHomeScreen,
    }),
    [canRenderMiniPlayer, isMiniPlayerShown, onHomeScreen],
  );
}

/** Fixed-size bottom offset applied when bottom actions are rendered. */
export const BottomActionsOffset = 72; // 56px Height + 16px Bottom Padding

/** Returns the offset we need to apply to account for the bottom actions. */
export function useBottomActionsOffset(additionalOffset = 0) {
  const activeTrack = usePlaybackStore((s) => s.activeTrack);

  //? We've previously accounted for whether the miniplayer can be rendered on the
  //? route before applying the inset. This ends up changing the scroll position if
  //? we were scrolled to the end of the list and opened a unsupported route like
  //? the Now Playing screen. In all of our use cases, it's fine to leave the inset
  //? if the miniplayer is rendered.
  const isMiniPlayerRendered = !!activeTrack;

  return useMemo(
    () => (isMiniPlayerRendered ? BottomActionsOffset : 0) + additionalOffset,
    [additionalOffset, isMiniPlayerRendered],
  );
}
