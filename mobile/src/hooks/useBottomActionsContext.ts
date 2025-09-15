import { useRoute } from "@react-navigation/native";

import { useMusicStore } from "~/modules/media/services/Music";

/** Routes where we hide all "bottom actions". */
const overrideVisible = [
  "/playlist/create",
  "/playlist/modify",
  "/track/modify",
];

/**
 * Returns information about what "bottom actions" are displayed in the
 * `(main)` group along with the additional bottom padding required.
 */
export function useBottomActionsContext() {
  const { name } = useRoute();

  const pathname = "";
  // const pathname = usePathname(); // Fires whenever we navigate to a different screen.
  const activeTrackId = useMusicStore((state) => state.activeId);

  const isMiniPlayerRendered =
    !!activeTrackId && !overrideVisible.some((route) => pathname === route);

  // Bottom inset on home screen.
  let withNav = 76; // 60px Navbar Height + 16px Bottom Padding
  if (isMiniPlayerRendered) withNav += 67; // 64px MiniPlayer Height + 3px Gap
  // Bottom inset on screens with only MiniPlayer.
  let onlyPlayer = 0;
  if (isMiniPlayerRendered) onlyPlayer += 80; // 64px MiniPlayer Height + 16px Bottom Padding

  return {
    isRendered: {
      miniPlayer: isMiniPlayerRendered,
      // Show navbar when displaying `HomeScreens` navigator. Since this is
      // adjacent to the `MaterialTopTab.Navigator`, `useRoute` should only
      // return `HomeScreens` when on any of those screens.
      navBar: name === "HomeScreens",
    },
    bottomInset: { withNav, onlyPlayer },
  };
}
