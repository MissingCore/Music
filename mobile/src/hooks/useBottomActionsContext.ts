import type { Href } from "expo-router";
import { usePathname } from "expo-router";

import { useMusicStore } from "~/modules/media/services/Music";

/** Routes where we hide all "bottom actions". */
const overrideVisible = [
  "/playlist/create",
  "/playlist/modify",
  "/track/modify",
] satisfies Partial<Href[]>;

/** Routes where we should hide the navigation bar. */
const hideNavRoutes = [
  ...overrideVisible,
  "/album/",
  "/artist/",
  "/playlist/",
  "/now-playing",
] satisfies Partial<Href[]>;

/**
 * Returns information about what "bottom actions" are displayed in the
 * `(main)` group along with the additional bottom padding required.
 */
export function useBottomActionsContext() {
  const pathname = usePathname(); // Fires whenever we navigate to a different screen.
  const activeTrackId = useMusicStore((state) => state.activeId);

  const isMiniPlayerRendered =
    !!activeTrackId && !overrideVisible.some((route) => pathname === route);
  const hideNavBar = hideNavRoutes.some((route) => pathname.startsWith(route));

  // Bottom inset on home screen.
  let withNav = 76; // 60px Navbar Height + 16px Bottom Padding
  if (isMiniPlayerRendered) withNav += 67; // 64px MiniPlayer Height + 3px Gap
  // Bottom inset on screens with only MiniPlayer.
  let onlyPlayer = 0;
  if (isMiniPlayerRendered) onlyPlayer += 80; // 64px MiniPlayer Height + 16px Bottom Padding

  return {
    isRendered: { miniPlayer: isMiniPlayerRendered, navBar: !hideNavBar },
    bottomInset: { withNav, onlyPlayer },
  };
}
