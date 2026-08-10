// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { NavigationRoute, ParamListBase } from "@react-navigation/native";
import { useNavigationState } from "@react-navigation/native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
      navBar: Boolean(onHomeScreen),
    }),
    [canRenderMiniPlayer, isMiniPlayerShown, onHomeScreen],
  );
}

const ROW_HEIGHT = 56;
const ROW_GAP = 8;
const SPACING = 16;

/** Fixed-size bottom offset applied when bottom actions are rendered. */
export const BottomActionsOffset = ROW_HEIGHT + SPACING; // Height + Bottom Padding

interface BottomOffsetArgs {
  /** Number of rows of "floating content" displayed at the bottom of the screen. */
  maxRows?: 1 | 2;
  /** If at least 1 row is always visible. */
  rowAlwaysVisible?: boolean;
}

/** Returns the offset to adjust content based on what's on the bottom of the screen. */
export function useBottomActionsOffset({
  maxRows = 1,
  rowAlwaysVisible = false,
}: BottomOffsetArgs = {}) {
  const { bottom } = useSafeAreaInsets();
  const activeTrack = usePlaybackStore((s) => s.activeTrack);

  //? We've previously accounted for whether the miniplayer can be rendered on the
  //? route before applying the inset. This ends up changing the scroll position if
  //? we were scrolled to the end of the list and opened a unsupported route like
  //? the Now Playing screen. In all of our use cases, it's fine to leave the inset
  //? if the miniplayer is rendered.
  const isMiniPlayerRendered = !!activeTrack;

  return useMemo(() => {
    let defaultSpace = rowAlwaysVisible || maxRows === 2 ? ROW_HEIGHT : 0;
    //? If we can render only a single row and it's always visible, don't add more.
    if (isMiniPlayerRendered && !(rowAlwaysVisible && maxRows === 1)) {
      defaultSpace += ROW_HEIGHT;
      if (maxRows === 2) defaultSpace += ROW_GAP;
    }

    //? Remove unnecessary space when miniplayer isn't rendered.
    if (!isMiniPlayerRendered && !rowAlwaysVisible) defaultSpace -= SPACING;

    return defaultSpace + 2 * SPACING + bottom;
  }, [bottom, maxRows, rowAlwaysVisible, isMiniPlayerRendered]);
}
