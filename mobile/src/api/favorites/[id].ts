import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, not } from "drizzle-orm";

import { db } from "@/db";
import { albums, playlists, tracks } from "@/db/schema";
import { favoriteKeys } from "./_queryKeys";
import { albumKeys } from "../albums/_queryKeys";
import { playlistKeys } from "../playlists/_queryKeys";
import { trackKeys } from "../tracks/_queryKeys";

import { Resynchronize } from "@/modules/media/services/Music";

import { ReservedPlaylists } from "@/modules/media/constants/ReservedNames";
import type { MediaType } from "@/modules/media/types";

type BaseFnArgs = { type: Exclude<MediaType, "artist" | "folder">; id: string };

export async function toggleFavorite({ type, id }: BaseFnArgs) {
  if (type === "album") {
    await db
      .update(albums)
      .set({ isFavorite: not(albums.isFavorite) })
      .where(eq(albums.id, id));
  } else if (type === "playlist") {
    await db
      .update(playlists)
      .set({ isFavorite: not(playlists.isFavorite) })
      .where(eq(playlists.name, id));
  } else {
    await db
      .update(tracks)
      .set({ isFavorite: not(tracks.isFavorite) })
      .where(eq(tracks.id, id));
    await Resynchronize.onTracks({
      type: "playlist",
      id: ReservedPlaylists.favorites,
    });
  }
}

type TData = { name: string; id?: string; isFavorite: boolean };

/** Toggle the favorite status of supported media. */
export const useToggleFavorite = (args: BaseFnArgs) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleFavorite(args),
    onSuccess: () => {
      const { type, id } = args;
      const usedKey =
        type === "album"
          ? albumKeys
          : type === "playlist"
            ? playlistKeys
            : trackKeys;

      // Update specific entry.
      queryClient.setQueryData(usedKey.detail(id), (old?: Partial<TData>) =>
        old ? { ...old, isFavorite: !old.isFavorite } : undefined,
      );
      // Update entry in cumulative list.
      const pk = type === "playlist" ? "name" : "id";
      queryClient.setQueryData(usedKey.all, (old?: Array<Partial<TData>>) =>
        old?.map((data) => {
          if (data[pk] !== id) return data;
          return { ...data, isFavorite: !data.isFavorite };
        }),
      );
      // Additional invalidation to any favorite-related content.
      queryClient.invalidateQueries({
        queryKey:
          type === "track" ? favoriteKeys.tracks() : favoriteKeys.lists(),
      });
    },
  });
};
