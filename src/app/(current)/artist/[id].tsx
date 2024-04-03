import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function CurrentArtistScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-geistMonoMedium text-foreground50">
        Current Artist Screen: {id}
      </Text>
    </View>
  );
}
