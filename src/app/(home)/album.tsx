import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { ScrollView } from "react-native";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { type Album, albums } from "@/db/schema";
import { useGetColumnWidth } from "@/hooks/layout";

import MediaCard from "@/features/media/MediaCard";

type AlbumWRelations = Album & {
  artist: { name: string };
  tracks: { id: string }[];
};

export default function AlbumScreen() {
  const [albumLibrary, setAlbumLibrary] = useState<AlbumWRelations[]>([]);
  const colWidth = useGetColumnWidth({
    cols: 2,
    gap: 16,
    gutters: 32,
    minWidth: 175,
  });

  useEffect(() => {
    async function getAllAlbums() {
      const allAlbums = await db.query.albums.findMany({
        with: {
          artist: { columns: { name: true } },
          tracks: { columns: { id: true } },
        },
        orderBy: [asc(albums.name)],
      });
      setAlbumLibrary(allAlbums);
    }
    getAllAlbums();
  }, []);

  if (albumLibrary.length === 0) return null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="mt-5 w-full flex-row flex-wrap gap-4 px-4 pb-16"
    >
      {albumLibrary.map(({ id, name, coverSrc, artist, tracks }) => (
        <Link key={id} href={`/album/${id}`}>
          <MediaCard
            imgSrc={coverSrc}
            imgSize={colWidth}
            type="album"
            title={name}
            subTitle={artist.name}
            extra={
              tracks.length === 1 ? "| 1 Track" : `| ${tracks.length} Tracks`
            }
          />
        </Link>
      ))}
    </ScrollView>
  );
}
