import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/Colors";

export default function ArtistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Artist Screen</Text>
      <Link href={`/artist/${"twenty_one_pilots"}`} style={{ color: "white" }}>
        View Artist
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
