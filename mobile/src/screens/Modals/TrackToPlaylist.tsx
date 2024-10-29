import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { and, eq } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { SheetProps } from "react-native-actions-sheet";
import { SheetManager } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";

import { db } from "@/db";
import { tracksToPlaylists } from "@/db/schema";
import { getPlaylists } from "@/db/queries";

import { Resynchronize, musicStore } from "@/modules/media/services/Music";
import { useTheme } from "@/hooks/useTheme";

import { favoriteKeys, playlistKeys, trackKeys } from "@/constants/QueryKeys";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import type { Maybe } from "@/utils/types";
import { Button } from "@/components/new/Form";
import { Loading } from "@/components/new/Loading";
import { Marquee } from "@/components/new/Marquee";
import { Sheet } from "@/components/new/Sheet";
import { StyledText } from "@/components/new/Typography";

/** Sheet allowing us to select which playlists the track belongs to. */
export default function TrackToPlaylistSheet(
  props: SheetProps<"track-to-playlist-sheet">,
) {
  const { t } = useTranslation();
  const { canvasAlt, surface } = useTheme();
  const { isPending, data } = usePlaylists();
  const { data: inList } = useTrackPlaylists(props.payload?.id);
  const onToggle = useToggleInPlaylist(props.payload?.id);

  return (
    <Sheet
      id={props.sheetId}
      title={t("playlist.add")}
      // Hide the Track sheet when we close this sheet since it's still open.
      onBeforeClose={() => SheetManager.hide("track-sheet")}
      snapTop
      contentContainerClassName="h-full pb-0"
    >
      <FlashList
        estimatedItemSize={58} // 54px Height + 4px Margin Top
        data={data}
        keyExtractor={({ name }) => name}
        renderItem={({ item, index }) => {
          const selected = inList?.includes(item.name);
          return (
            <View
              className={cn({
                "mt-1": index !== 0,
                "mb-4": index === data!.length - 1,
              })}
            >
              <Button
                preset="plain"
                onPress={() => mutateGuard(onToggle, item.name)}
                className={cn({ "bg-surface": selected })}
              >
                <Marquee color={selected ? surface : canvasAlt}>
                  <StyledText>{item.name}</StyledText>
                </Marquee>
              </Button>
            </View>
          );
        }}
        ListEmptyComponent={
          isPending ? (
            <Loading />
          ) : (
            <StyledText center>{t("response.noPlaylists")}</StyledText>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </Sheet>
  );
}

//#region Data
async function getTrackPlaylists(trackId: string) {
  const allTracksToPlaylists = await db.query.tracksToPlaylists.findMany({
    where: (fields, { eq }) => eq(fields.trackId, trackId),
    columns: {},
    with: { playlist: { columns: { name: true } } },
  });
  return allTracksToPlaylists.map(({ playlist }) => playlist.name);
}

async function toggleInPlaylist(playlistName: string, trackId: Maybe<string>) {
  if (!trackId) return;
  await db.transaction(async (tx) => {
    const exists = await tx.query.tracksToPlaylists.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.trackId, trackId), eq(fields.playlistName, playlistName)),
    });
    if (exists) {
      await tx
        .delete(tracksToPlaylists)
        .where(
          and(
            eq(tracksToPlaylists.trackId, trackId),
            eq(tracksToPlaylists.playlistName, playlistName),
          ),
        );
    } else {
      await tx.insert(tracksToPlaylists).values({ trackId, playlistName });
    }

    const currPlayingFrom = musicStore.getState().playingSource;
    if (
      currPlayingFrom?.type === "playlist" &&
      currPlayingFrom.id === playlistName
    ) {
      await Resynchronize.onTracks(currPlayingFrom);
    }
  });
}

const usePlaylists = () =>
  useQuery({
    queryKey: playlistKeys.all,
    queryFn: () => getPlaylists(),
    select: (data) => data.sort((a, b) => a.name.localeCompare(b.name)),
    staleTime: Infinity,
  });

const useTrackPlaylists = (trackId: Maybe<string>) =>
  useQuery({
    enabled: !!trackId,
    queryKey: trackKeys.detailWithRelation(trackId!),
    queryFn: () => getTrackPlaylists(trackId!),
  });

function useToggleInPlaylist(trackId: Maybe<string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistName: string) =>
      toggleInPlaylist(playlistName, trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trackKeys.detailWithRelation(trackId!),
      });
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
    },
  });
}
//#endregion
