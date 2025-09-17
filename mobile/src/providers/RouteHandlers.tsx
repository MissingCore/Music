import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { Linking } from "react-native";

/** Handle deep links by `react-native-track-player`.  */
export function DeepLinkHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    // Fired when the app is already open and the notification is clicked.
    const subscription = Linking.addEventListener("url", (data) => {
      if (data.url === "trackplayer://notification.click") {
        navigation.navigate("NowPlaying");
      }
    });
    return () => subscription.remove();
  }, [navigation]);

  return null;
}
