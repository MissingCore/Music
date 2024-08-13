import { router } from "expo-router";
import { useEffect } from "react";
import { Linking } from "react-native";

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
