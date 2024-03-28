import type { DimensionValue, StyleProp, TextStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import Colors from "@/constants/Colors";

type Props = {
  type: "artist" | "album" | "playlist" | "song";
  imgSrc?: string;
  imgSize: DimensionValue;
  title?: string;
  subTitle?: string;
  extra?: string;
};

/** @description Displays an Album, Artist, Playlist, or Song card. */
export default function MediaCard({ imgSize, imgSrc, type, ...text }: Props) {
  const isArtist = type === "artist";
  const isSong = type === "song";

  return (
    <View style={{ width: "100%", maxWidth: imgSize }}>
      <Image
        source={imgSrc}
        placeholder={
          isArtist
            ? require("@/assets/images/glyph/face.png")
            : require("@/assets/images/glyph/music.png")
        }
        contentFit="cover"
        style={{
          aspectRatio: "1 / 1",
          width: "100%",
          backgroundColor: isSong ? Colors.surface : Colors.surfaceDim,
          borderRadius: isArtist ? 999 : 16,
        }}
      />
      <View style={{ paddingHorizontal: 4 }}>
        <MediaText style={styles.title} content={text.title} />
        <View style={styles.subTextContainer}>
          <MediaText style={styles.subTitle} content={text.subTitle} />
          <MediaText
            style={styles.extraText}
            content={text.extra}
            noPlaceholder
          />
        </View>
      </View>
    </View>
  );
}

type MediaTextProps = {
  content?: string;
  style?: StyleProp<TextStyle>;
  noPlaceholder?: boolean;
};

/** @description Renders text with placeholder. */
function MediaText({ content, style, noPlaceholder }: MediaTextProps) {
  if (!content && noPlaceholder) return null;
  return (
    <Text numberOfLines={1} style={style}>
      {content || "Nothing"}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 2,
    fontFamily: "GeistMono",
    fontSize: 16,
    color: Colors.foreground,
  },
  subTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  subTitle: {
    flex: 1,
    flexShrink: 1,
    fontFamily: "GeistMonoLight",
    fontSize: 12,
    color: Colors.foregroundSoft,
  },
  extraText: {
    fontFamily: "GeistMonoLight",
    fontSize: 12,
    color: Colors.foregroundSoft,
  },
});
