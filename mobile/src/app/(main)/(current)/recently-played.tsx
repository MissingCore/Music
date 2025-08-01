import { View } from "react-native";

import { StyledText } from "~/components/Typography/StyledText";

/** Screen for `/recently-played` route. */
export default function RecentlyPlayedScreen() {
  return (
    <View className="p-4">
      <StyledText>Recently Played</StyledText>
    </View>
  );
}
