import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function AlbumScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-geistMonoMedium text-lg text-foreground50">
        Album Screen
      </Text>
      <Link
        href={`/album/${"trench"}`}
        className="font-geistMonoMedium text-foreground100"
      >
        View Album
      </Link>
    </View>
  );
}
