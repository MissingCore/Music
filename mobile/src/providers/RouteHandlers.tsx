import { atom, useSetAtom } from "jotai";
import { router, usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { Linking } from "react-native";

/** All of the route handlers inside a single component. */
export function RouteHandlers() {
  return (
    <>
      <DeepLinkHandler />
      <PrevRouteTracker />
    </>
  );
}

/** Handle deep links by `react-native-track-player`.  */
export function DeepLinkHandler() {
  useEffect(() => {
    function deepLinkHandler(data: { url: string }) {
      if (data.url === "trackplayer://notification.click") {
        router.navigate("/current-track");
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

export const prevRouteAtom = atom("/");

/** Keeps track of the last route we've navigated to. */
export function PrevRouteTracker() {
  const prevPathname = useRef("/");
  const pathname = usePathname();
  const setPrevRoute = useSetAtom(prevRouteAtom);

  useEffect(() => {
    setPrevRoute(prevPathname.current);
    prevPathname.current = pathname;
  }, [setPrevRoute, pathname]);

  return null;
}
