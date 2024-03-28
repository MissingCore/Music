import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/Colors";

export default function TrackScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.foreground,
  },
});
