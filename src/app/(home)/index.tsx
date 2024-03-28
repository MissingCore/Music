import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useGetColumnWidth } from "@/hooks/layout";

import Colors from "@/constants/Colors";
import MediaCard from "@/components/MediaCard";

export default function HomeScreen() {
  const colWidth = useGetColumnWidth({
    cols: 2,
    gap: 16,
    gutters: 32,
    minWidth: 175,
  });

  const colWidthSmall = useGetColumnWidth({
    cols: 1,
    gap: 16,
    gutters: 32,
    minWidth: 100,
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { paddingHorizontal: 16, marginTop: 0 }]}>
        RECENTLY PLAYED
      </Text>
      <ScrollView
        contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}
        horizontal
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
      >
        <MediaCard
          imgSize={colWidthSmall}
          type="artist"
          title="Artist Name"
          subTitle="24 Tracks"
        />
        <MediaCard
          imgSize={colWidthSmall}
          type="song"
          title="Song Name"
          subTitle="Artist Name"
        />
        <MediaCard
          imgSize={colWidthSmall}
          type="playlist"
          title="Playlist Name"
          subTitle="Artist Name"
          extra="| 8 Tracks"
        />
        <MediaCard
          imgSize={colWidthSmall}
          type="album"
          title="Album Name"
          subTitle="Artist Name"
          extra="| 10 Tracks"
        />
        <MediaCard imgSize={colWidthSmall} type="song" />
      </ScrollView>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={styles.title}>FAVORITES</Text>
        <View style={styles.gridContainer}>
          <View style={{ width: "100%", maxWidth: colWidth }}>
            <View style={styles.favSongContainer}>
              <Text style={styles.favSongText}>10</Text>
              <Text style={styles.favSongText}>SONGS</Text>
            </View>
          </View>

          <MediaCard
            imgSize={colWidth}
            type="playlist"
            title="Extra long playlist name"
            subTitle="Duper long artist name"
            extra="| 8 Tracks"
          />
          <MediaCard
            imgSize={colWidth}
            type="playlist"
            title="Album Name"
            subTitle="Artist Name"
            extra="| 10 Tracks"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingBottom: 64,
  },
  title: {
    marginTop: 32,
    marginBottom: 16,
    fontFamily: "GeistMonoMedium",
    fontSize: 28,
    color: Colors.foreground,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    width: "100%",
  },
  favSongContainer: {
    aspectRatio: "1 / 1",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: Colors.accent,
  },
  favSongText: {
    fontFamily: "Ndot57",
    fontSize: 32,
    color: Colors.foreground,
  },
});
