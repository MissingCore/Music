import { usePathname } from "expo-router";

import { useMusicStore } from "@/modules/media/services/Music";

/**
 * Returns information about what "bottom actions" are displayed in the
 * `(main)` group along with the additional bottom padding required.
 */
export function useBottomActionsContext() {
  const pathname = usePathname(); // Fires whenever we navigate to a different screen.
  const activeTrackId = useMusicStore((state) => state.activeId);

  const isMiniPlayerRendered = !!activeTrackId;
  const hideNavBar = ["/playlist/", "/album/", "/artist/"].some((route) =>
    pathname.startsWith(route),
  );

  // Bottom inset on home screen.
  let withNav = 76; // 60px Navbar Height + 16px Bottom Padding
  if (isMiniPlayerRendered) withNav += 67; // 64px MiniPlayer Height + 3px Gap
  // Bottom inset on screens with only MiniPlayer.
  let onlyPlayer = 16;
  if (isMiniPlayerRendered) onlyPlayer += 64;

  return {
    isRendered: { miniPlayer: isMiniPlayerRendered, navBar: !hideNavBar },
    bottomInset: { withNav, onlyPlayer },
  };
}
