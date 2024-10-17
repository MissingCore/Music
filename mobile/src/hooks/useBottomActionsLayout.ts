import { usePathname } from "expo-router";

import { useMusicStore } from "@/modules/media/services/Music";

/**
 * Returns information about what "bottom actions" are displayed in the
 * `(app)` group along with the additional bottom padding required.
 */
export function useBottomActionsLayout() {
  const pathname = usePathname(); // Fires whenever we navigate to a different screen.
  const activeTrackId = useMusicStore((state) => state.activeId);

  const isMiniPlayerRendered = !!activeTrackId;
  const hideNavBar = ["/playlist/", "/album/", "/artist/"].some((route) =>
    pathname.startsWith(route),
  );

  // The bottom insets required (excludes the `16px` bottom padding
  // present in the layout).
  let bottomInset = 0;
  if (isMiniPlayerRendered) bottomInset += 64;
  if (!hideNavBar) bottomInset += 60;
  if (isMiniPlayerRendered && !hideNavBar) bottomInset += 3;

  return {
    isRendered: { miniPlayer: isMiniPlayerRendered, navBar: !hideNavBar },
    bottomInset,
  };
}
