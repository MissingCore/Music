import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { db } from "@/db";
import type { Album, Artist, Track } from "@/db/schema";

type AlbumWRelations = Album & { artist: Artist; tracks: Track[] };

export default function CurrentAlbumScreen() {
  const { id } = useLocalSearchParams();
  const [album, setAlbum] = useState<AlbumWRelations>();

  useEffect(() => {
    async function getAlbum() {
      const currAlbum = await db.query.albums.findFirst({
        with: { artist: true, tracks: true },
        where: (fields, { eq }) => eq(fields.id, id as string),
      });
      setAlbum(currAlbum);
    }
    getAlbum();
  }, [id]);

  if (!album) return null;

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-geistMonoMedium text-foreground50">
        {album.name}
      </Text>
    </View>
  );
}
