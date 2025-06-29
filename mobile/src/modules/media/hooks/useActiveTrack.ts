import { useCallback, useEffect, useMemo, useState } from "react";

import type { TrackWithAlbum } from "~/db/schema";

import { deleteTrack } from "~/api/track";
import { useTrack } from "~/queries/track";
import { musicStore, useMusicStore } from "../services/Music";

import { clearAllQueries } from "~/lib/react-query";

/**
 * Returns a `TrackWithAlbum` entry for the current playing track, whose
 * value will update when we invalidate the React Query cache.
 */
export function useActiveTrack() {
  const [prevTrack, setPrevTrack] = useState<TrackWithAlbum | undefined>();
  const activeId = useMusicStore((state) => state.activeId);
  const { isPending, error, data } = useTrack(activeId ?? "");

  /** Handle when the active track doesn't exist in the database. */
  const onError = useCallback(async () => {
    if (!activeId) return;
    try {
      console.log(
        `[Database Mismatch] Track (${activeId}) doesn't exist in the database.`,
      );
      await deleteTrack(activeId);
      clearAllQueries();
      await musicStore.getState().reset();
    } catch {}
  }, [activeId]);

  useEffect(() => {
    if (isPending) return;
    else if (error) onError();
    setPrevTrack(data);
  }, [isPending, error, data, onError]);

  return useMemo(() => {
    if (isPending) return prevTrack;
    return data;
  }, [isPending, data, prevTrack]);
}
