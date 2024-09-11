import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, not } from "drizzle-orm";
import { useSetAtom } from "jotai";

import { db } from "@/db";
import { albums, playlists, tracks } from "@/db/schema";
import { favoriteKeys } from "./_queryKeys";
import { albumKeys } from "../albums/_queryKeys";
import { playlistKeys } from "../playlists/_queryKeys";
import { trackKeys } from "../tracks/_queryKeys";

// import { resynchronizeOnAtom } from "@/features/playback/api/synchronize";
import { ReservedPlaylists } from "@/modules/media/constants/ReservedNames";

import type { Media } from "@/components/media/types";

type BaseFnArgs = { type: Exclude<Media, "artist">; id: string };

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
  }
}

type TData = { name: string; id?: string; isFavorite: boolean };

/** Toggle the favorite status of supported media. */
export const useToggleFavorite = (args: BaseFnArgs) => {
  const queryClient = useQueryClient();
  // const resynchronizeFn = useSetAtom(resynchronizeOnAtom);

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
      // // Resynchronize with Jotai.
      // if (type === "track") {
      //   resynchronizeFn({
      //     action: "update",
      //     data: {
      //       type: "playlist",
      //       id: ReservedPlaylists.favorites,
      //       name: ReservedPlaylists.favorites,
      //     },
      //   });
      // }
    },
  });
};
