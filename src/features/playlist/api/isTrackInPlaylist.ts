import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

async function getIsTrackInPlaylist(
  trackId: string,
  playlistName: string | undefined,
) {
  if (!playlistName) return false;
  const entry = await db.query.tracksToPlaylists.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.trackId, trackId), eq(fields.playlistName, playlistName)),
  });
  return !!entry;
}

/** @description Determine if track is in playlist. */
export const useIsTrackInPlaylist = (
  trackId: string,
  playlistName: string | undefined,
) =>
  useQuery({
    queryKey: [{ entity: "is-track-in-playlist", trackId, playlistName }],
    queryFn: () => getIsTrackInPlaylist(trackId, playlistName),
    placeholderData: () => false,
    gcTime: 0,
  });
