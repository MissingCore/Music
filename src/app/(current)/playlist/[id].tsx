import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function CurrentPlaylistScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-geistMonoMedium text-foreground">
        Current Playlist Screen: {id}
      </Text>
    </View>
  );
}
