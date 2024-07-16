import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { and, eq } from "drizzle-orm";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { Toast } from "react-native-toast-notifications";

import { db } from "@/db";
import { playlists, tracksToPlaylists } from "@/db/schema";
import { getPlaylist } from "@/db/queries";
import { favoriteKeys } from "@/api/favorites/_queryKeys";
import { playlistKeys } from "@/api/playlists/_queryKeys";
import { trackKeys } from "../_queryKeys";

import { resynchronizeOnAtom } from "@/features/playback/api/synchronize";

import type { ExtractFnReturnType, Prettify } from "@/utils/types";

type BaseFnArgs = { trackId: string };

// ---------------------------------------------------------------------
//                            GET Methods
// ---------------------------------------------------------------------
export async function getTracksToPlaylists({ trackId }: { trackId: string }) {
  const allTracksToPlaylists = await db.query.tracksToPlaylists.findMany({
    where: (fields, { eq }) => eq(fields.trackId, trackId),
    columns: {},
    with: { playlist: { columns: { name: true } } },
  });
  return allTracksToPlaylists.map(({ playlist }) => playlist.name);
}

type GETFnData = ExtractFnReturnType<typeof getTracksToPlaylists>;

/** Returns all playlists this track is a part of. */
export const trackInPlaylistsOptions = (trackId: string) =>
  queryOptions({
    queryKey: trackKeys.detailWithRelation(trackId),
    queryFn: () => getTracksToPlaylists({ trackId }),
    gcTime: 0,
  });

/** Returns if the track is in a given playlist. */
export const useIsTrackInPlaylist = (trackId: string, playlistName: string) =>
  useQuery({
    ...trackInPlaylistsOptions(trackId),
    select: useCallback(
      (data: GETFnData) => data.includes(playlistName),
      [playlistName],
    ),
  });

// ---------------------------------------------------------------------
//                            PUT Methods
// ---------------------------------------------------------------------
type PUTFnArgs = Prettify<BaseFnArgs & { playlistNames: string[] }>;

export async function putTrackInPlaylists({
  trackId,
  playlistNames,
}: PUTFnArgs) {
  await db.transaction(async (tx) => {
    await tx
      .delete(tracksToPlaylists)
      .where(eq(tracksToPlaylists.trackId, trackId));

    const newEntries = playlistNames.map((name) => {
      return { playlistName: name, trackId };
    });
    if (newEntries.length > 0) {
      await tx.insert(tracksToPlaylists).values(newEntries);
    }
  });
}

/** Put track in the specified playlists. */
export function usePutTrackInPlaylists(trackId: string) {
  const queryClient = useQueryClient();
  const resynchronizeFn = useSetAtom(resynchronizeOnAtom);

  return useMutation({
    mutationFn: (playlistNames: string[]) =>
      putTrackInPlaylists({ trackId, playlistNames }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trackKeys.detailWithRelation(trackId),
      });
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
      // Resynchronize with Jotai.
      resynchronizeFn({ action: "update", data: null });
    },
  });
}

// ---------------------------------------------------------------------
//                            DELETE Methods
// ---------------------------------------------------------------------
type DELETEFnArgs = Prettify<BaseFnArgs & { playlistName: string }>;

export async function deleteTrackFromPlaylist({
  trackId,
  playlistName,
}: DELETEFnArgs) {
  const removedRelation = await getPlaylist([eq(playlists.name, playlistName)]);
  await db
    .delete(tracksToPlaylists)
    .where(
      and(
        eq(tracksToPlaylists.trackId, trackId),
        eq(tracksToPlaylists.playlistName, playlistName),
      ),
    );

  return removedRelation.isFavorite;
}

/** Delete track from specified playlist. */
export function useDeleteTrackFromPlaylist(
  trackId: string,
  playlistName: string,
) {
  const queryClient = useQueryClient();
  const resynchronizeFn = useSetAtom(resynchronizeOnAtom);

  return useMutation({
    mutationFn: () => deleteTrackFromPlaylist({ trackId, playlistName }),
    onSuccess: (wasFavorited: boolean) => {
      queryClient.invalidateQueries({
        queryKey: trackKeys.detailWithRelation(trackId),
      });
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      // Refresh favorites list if playlist was favorited.
      if (wasFavorited) {
        queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
      }
      // Resynchronize with Jotai.
      resynchronizeFn({
        action: "update",
        data: { type: "playlist", id: playlistName, name: playlistName },
      });
      Toast.show("Removed track from playlist.");
    },
  });
}
