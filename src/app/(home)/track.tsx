import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function TrackScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-geistMonoMedium text-lg text-foreground50">
        Track Screen
      </Text>
      <Link
        href="/current-track"
        className="font-geistMonoMedium text-foreground100"
      >
        View Current Playing Track
      </Link>
    </View>
  );
}
