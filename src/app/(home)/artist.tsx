import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function ArtistScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-geistMonoMedium text-lg text-foreground50">
        Artist Screen
      </Text>
      <Link
        href={`/artist/${"twenty_one_pilots"}`}
        className="font-geistMonoMedium text-foreground100"
      >
        View Artist
      </Link>
    </View>
  );
}
