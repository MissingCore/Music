import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function PlaylistScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-geistMonoMedium text-lg text-foreground50">
        Playlist Screen
      </Text>
      <Link
        href={`/playlist/${"good_vibes"}`}
        className="font-geistMonoMedium text-foreground100"
      >
        View Playlist
      </Link>
    </View>
  );
}
