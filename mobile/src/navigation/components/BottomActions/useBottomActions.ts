// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigationState } from "@react-navigation/native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlaybackStore } from "~/stores/Playback/store";

/** Non-root screen routes where the miniplayer is visible. */
const miniplayerRoutes = [
  "RecentlyPlayed-",
  "Album-",
  "Artist-",
  "Genre-",
  "Playlist-",
];

/** Determines if the miniplayer is visible on the screen. */
export function useIsMiniplayerVisible() {
  const mostRecentRouteKey = useNavigationState((s) => s.routes.at(-1)?.key);
  const canRenderMiniplayer = usePlaybackStore((s) => Boolean(s.activeTrack));

  const isMiniplayerShown = miniplayerRoutes.some((key) =>
    mostRecentRouteKey?.startsWith(key),
  );
  // Show navbar when displaying `HomeScreens` navigator. This is only
  // true when the returned routes only contain this entry.
  const onHomeScreen = Boolean(mostRecentRouteKey?.startsWith("HomeScreens-"));

  return useMemo(
    () => canRenderMiniplayer && (onHomeScreen || isMiniplayerShown),
    [canRenderMiniplayer, isMiniplayerShown, onHomeScreen],
  );
}

// 16px Vertical Padding + Toolbar Height
export const MiniplayerOffset = 32 + 48;

/** Returns the offset to adjust content based on what's on the bottom of the screen. */
export function useBottomActionsOffset() {
  const { bottom } = useSafeAreaInsets();
  //? We've previously accounted for whether the miniplayer can be rendered on the
  //? route before applying the inset. This ends up changing the scroll position if
  //? we were scrolled to the end of the list and opened a unsupported route like
  //? the Now Playing screen. In all of our use cases, it's fine to leave the inset
  //? if the miniplayer is rendered.
  const isMiniplayerRendered = usePlaybackStore((s) => Boolean(s.activeTrack));

  return useMemo(() => {
    // Android Navbar Height + "Miniplayer Offset" + Miniplayer Space (Height + Gap)
    return bottom + MiniplayerOffset + (isMiniplayerRendered ? 56 + 8 : 0);
  }, [bottom, isMiniplayerRendered]);
}
