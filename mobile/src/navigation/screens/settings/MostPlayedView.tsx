import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { db } from "~/db";
import { getArtistsString } from "~/db/utils";

import { iAsc } from "~/lib/drizzle";
import { FlatList } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { SegmentedList } from "~/components/List/Segmented";
import { StyledText } from "~/components/Typography/StyledText";
import { ContentPlaceholder } from "../../components/Placeholder";

export default function MostPlayed() {
  const { isPending, data } = useMostPlayedTracks();

  if (isPending || data?.length === 0) {
    return (
      <ContentPlaceholder isPending={isPending} errMsgKey="err.msg.noResults" />
    );
  }
  return (
    <SegmentedList scrollEnabled contentContainerClassName="p-4">
      {data?.map((item) => (
        <SegmentedList.CustomItem key={item.placement} className="flex-row p-1">
          <PlacementNumber placement={item.placement} />
          <PlayCountList tracks={item.tracks} />
        </SegmentedList.CustomItem>
      ))}
    </SegmentedList>
  );
}

//#region List Components
function PlacementNumber({ placement }: { placement: number }) {
  return (
    <View className="size-12 items-center justify-center">
      <StyledText>{placement}</StyledText>
    </View>
  );
}

function PlayCountList({ tracks }: { tracks: TrackData[] }) {
  const { t } = useTranslation();
  return (
    <FlatList
      data={tracks}
      keyExtractor={({ id }) => id}
      renderItem={({
        item: { name, artistsString, albumName, playCount },
        index,
      }) => (
        <View className="gap-2">
          <View>
            <StyledText className="text-sm">{name}</StyledText>
            {artistsString ? (
              <StyledText dim className="text-foreground/80">
                {artistsString}
              </StyledText>
            ) : null}
            {albumName ? <StyledText dim>{albumName}</StyledText> : null}
          </View>
          <Divider />
          {tracks.length - 1 === index ? (
            <StyledText numberOfLines={1} className="text-xs text-red">
              {t("feat.mostPlayed.extra.playCount", { count: playCount })}
            </StyledText>
          ) : null}
        </View>
      )}
      className="shrink grow gap-2 p-2 pr-3"
    />
  );
}
//#endregion

//#region Data Query
type TrackData = {
  id: string;
  name: string;
  playCount: number;
  artistsString: string | null;
  albumName: string | null;
};

type MostPlayedPlacement = { placement: number; tracks: TrackData[] };

async function getMostPlayedTracks() {
  const mostPlayedTracks = await db.query.tracks.findMany({
    where: (fields, { gt }) => gt(fields.playCount, 0),
    columns: { id: true, name: true, playCount: true },
    with: {
      album: { columns: { name: true } },
      tracksToArtists: { columns: { artistName: true } },
    },
    orderBy: (fields, { desc }) => [desc(fields.playCount), iAsc(fields.name)],
    limit: 100,
  });

  const groupedPlacement: MostPlayedPlacement[] = [];
  let recentPlacement: MostPlayedPlacement | undefined;
  mostPlayedTracks.forEach(({ album, tracksToArtists, ...track }) => {
    const formattedTrack = {
      ...track,
      albumName: album?.name ?? null,
      artistsString: getArtistsString(tracksToArtists, false),
    };

    if (!recentPlacement) {
      recentPlacement = { placement: 1, tracks: [formattedTrack] };
      return;
    }

    // If the current track belongs in the same placement.
    if (recentPlacement.tracks.at(-1)!.playCount === formattedTrack.playCount) {
      recentPlacement.tracks.push(formattedTrack);
      return;
    }

    // If this track is of a lower placement.
    groupedPlacement.push(recentPlacement);
    recentPlacement = {
      placement: recentPlacement.placement + recentPlacement.tracks.length,
      tracks: [formattedTrack],
    };
  });

  // Push last placement.
  if (recentPlacement) groupedPlacement.push(recentPlacement);

  return groupedPlacement;
}

const queryKey = ["settings", "most-played"];

function useMostPlayedTracks() {
  return useQuery({
    queryKey,
    queryFn: getMostPlayedTracks,
    gcTime: 0,
    staleTime: 0,
  });
}
//#endregion
