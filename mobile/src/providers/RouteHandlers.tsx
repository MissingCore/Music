import type { Href } from "expo-router";
import { router, usePathname } from "expo-router";
import { useEffect } from "react";
import { Linking } from "react-native";

import { useNavigationStore } from "~/services/NavigationStore";

/** All of the route handlers inside a single component. */
export function RouteHandlers() {
  return (
    <>
      <DeepLinkHandler />
      <HistoryTracker />
    </>
  );
}

/** Handle deep links by `react-native-track-player`.  */
export function DeepLinkHandler() {
  useEffect(() => {
    function deepLinkHandler(data: { url: string }) {
      if (data.url === "trackplayer://notification.click") {
        router.navigate("/now-playing");
      }
    }
    // This event will be fired when the app is already open and the notification is clicked
    const subscription = Linking.addEventListener("url", deepLinkHandler);

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}

/** Subscribes to route changes to keep the Navigation store up-to-date. */
export function HistoryTracker() {
  const pathname = usePathname();
  const handleNavigation = useNavigationStore(
    (state) => state.handleNavigation,
  );

  useEffect(() => {
    handleNavigation(pathname as Href);
  }, [handleNavigation, pathname]);

  return null;
}
