import type { NavigationRoute, ParamListBase } from "@react-navigation/native";
import { useNavigationState } from "@react-navigation/native";

import { useMusicStore } from "~/modules/media/services/Music";

/** Routes where the miniplayer is visible. */
const miniPlayerRoutes = [
  "Home-",
  "Folders-",
  "Playlists-",
  "Tracks-",
  "Albums-",
  "Artists-",
  "RecentlyPlayed-",
  "FavoriteTracks-",
  "Album-",
  "Artist-",
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
  const activeTrackId = useMusicStore((state) => state.activeId);

  // Show navbar when displaying `HomeScreens` navigator. This is only
  // true when the returned routes only contain this entry.
  const onHomeScreen = availableRoutes.at(-1)?.key.startsWith("HomeScreens-");

  return {
    miniPlayer:
      !!activeTrackId &&
      (onHomeScreen || showMiniPlayerOnRoute(availableRoutes)),
    navBar: onHomeScreen,
  };
}

/** Returns the inset we need to apply to account for the bottom actions. */
export function useBottomActionsInset() {
  // Wanted structure of `availableRoutes` should be:
  //  - Array<{ key: miniPlayerVisibleRoutes[number] }>
  const availableRoutes = useNavigationState((s) => s.routes);
  const activeTrackId = useMusicStore((state) => state.activeId);

  const canShowMiniPlayer = showMiniPlayerOnRoute(availableRoutes);
  const isMiniPlayerRendered = !!activeTrackId && canShowMiniPlayer;

  // Bottom inset on home screen.
  let withNav = 76; // 60px Navbar Height + 16px Bottom Padding
  if (isMiniPlayerRendered) withNav += 67; // 64px MiniPlayer Height + 3px Gap
  // Bottom inset on screens with only MiniPlayer.
  let onlyPlayer = 0;
  if (isMiniPlayerRendered) onlyPlayer += 80; // 64px MiniPlayer Height + 16px Bottom Padding

  return { withNav, onlyPlayer };
}
