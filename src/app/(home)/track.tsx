import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/Colors";

export default function TrackScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Screen</Text>
      <Link href="/current-track" style={{ color: "white" }}>
        View Current Playing Track
      </Link>
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
